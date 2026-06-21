"""
Lê o Excel "Formandos(as)" + snapshot da BD e produz import-plan.json com:
- trainees: lista de objectos prontos a inserir (sem id; gerados pelo TS)
- newClientOrgs: lista de client_orgs a criar (por domínio empresarial)

Estratégia "Estrito": só email + RGPD = Sim.
Strategy domínio: empresariais ganham client_org; pessoais ficam NULL.
"""
import json
import sys
import re
from pathlib import Path
from datetime import datetime, timezone
import openpyxl

XLSX = Path(r"C:\Users\silva\Downloads\Formandos(as) - 16_06_2026.xlsx")
HERE = Path(__file__).parent
SNAPSHOT = HERE / "_bd-snapshot.json"
PLAN = HERE / "_import-plan.json"

PERSONAL_DOMAINS = {
    # Webmail global
    "gmail.com", "gmail.pt", "googlemail.com",
    "hotmail.com", "hotmail.pt", "hotmail.es", "hotmail.co.uk", "hotmail.fr", "hotmail.it", "hotmail.de",
    "yahoo.com", "yahoo.pt", "yahoo.es", "yahoo.co.uk", "yahoo.fr", "yahoo.it", "yahoo.de", "yahoo.com.br", "ymail.com", "yahoo.es",
    "icloud.com", "me.com", "mac.com",
    "outlook.com", "outlook.pt", "outlook.es", "outlook.fr", "outlook.it",
    "live.com", "live.pt", "live.com.pt", "live.com.br", "live.fr",
    "msn.com",
    "mail.com",
    "aol.com",
    "protonmail.com", "proton.me",
    "gmx.com", "gmx.pt", "gmx.de", "gmx.net",
    "zoho.com",
    "fastmail.com", "tutanota.com", "tutamail.com",
    # ISPs e portais nacionais (PT, BR, FR, DE, US, UK)
    "sapo.pt", "sapo.com",
    "clix.pt", "netcabo.pt", "iol.pt", "telepac.pt", "meo.pt", "nos.pt",
    "terra.com.br", "uol.com.br", "ig.com.br", "bol.com.br", "globo.com",
    "free.fr", "orange.fr", "wanadoo.fr", "laposte.net", "sfr.fr", "neuf.fr",
    "web.de", "t-online.de", "freenet.de", "1und1.de", "arcor.de",
    "comcast.net", "sbcglobal.net", "cox.net", "att.net", "verizon.net",
    "charter.net", "earthlink.net", "rocketmail.com", "btinternet.com",
    "ntlworld.com", "blueyonder.co.uk", "talktalk.net", "virginmedia.com",
    # Outros ISPs / webmail menos comuns
    "optonline.net", "sympatico.ca", "rogers.com", "shaw.ca", "bell.net",
    "mail.ru", "yandex.ru", "yandex.com", "rambler.ru",
    # Email descartável / lixo / teste
    "mailinator.com", "guerrillamail.com", "10minutemail.com",
    "test.com", "example.com", "example.org", "noreply.com", "localhost",
}

PT_PT_TO_ISO = {
    "portuguesa": "PT", "portugal": "PT", "português": "PT", "portugues": "PT",
    "brasileira": "BR", "brasileiro": "BR", "brasil": "BR",
    "espanhola": "ES", "espanhol": "ES", "espanha": "ES",
    "francesa": "FR", "francês": "FR", "frances": "FR", "frança": "FR", "franca": "FR",
    "alemã": "DE", "alema": "DE", "alemao": "DE", "alemanha": "DE",
    "italiana": "IT", "italia": "IT", "itália": "IT",
    "inglesa": "GB", "ingles": "GB",
    "venezuelana": "VE", "venezuela": "VE",
}

def derive_country(nationality_raw: str | None) -> str:
    if not nationality_raw:
        return "PT"
    key = nationality_raw.strip().lower()
    return PT_PT_TO_ISO.get(key, "PT")

def split_name(full: str) -> tuple[str, str]:
    parts = re.split(r"\s+", full.strip())
    if len(parts) == 1:
        return parts[0], "—"
    return " ".join(parts[:-1]), parts[-1]

def normalise_domain_to_org_name(domain: str) -> str:
    """cetelem.pt -> Cetelem; decathlon.com -> Decathlon; bnp-paribas.fr -> Bnp Paribas."""
    label = domain.split(".")[0]
    label = label.replace("-", " ").replace("_", " ")
    return " ".join(w.capitalize() for w in label.split())

def parse_birth_date(v):
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    return None

def load_excel():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["Formandos(as)"]
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    return rows

def main():
    if not SNAPSHOT.exists():
        print("ERRO: corre primeiro api/scripts/import-trainees-snapshot.ts", file=sys.stderr)
        sys.exit(1)
    snap = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    existing_emails = set(e for e in snap["existingEmails"] if e)
    existing_org_map = {o["nameLc"]: o["id"] for o in snap["existingOrgs"]}

    rows = load_excel()
    accepted = []
    rejected = {"no_email": 0, "no_consent": 0, "consent_no": 0, "dup_intra": 0, "dup_bd": 0}
    seen_emails = set()
    domain_buckets = {}  # domain -> count

    for r in rows:
        nome, sexo, dnasc, cpf, endereco, cep, cidade, nacionalidade, estado, municipio, \
            email, telefone, num_id, segmento, cargo, tipo_id, consent = r

        if not email or not str(email).strip() or "@" not in str(email):
            rejected["no_email"] += 1
            continue
        email_lc = str(email).strip().lower()

        consent_str = str(consent or "").strip().lower()
        if not consent_str:
            rejected["no_consent"] += 1
            continue
        if consent_str.startswith("n"):
            rejected["consent_no"] += 1
            continue
        if not consent_str.startswith("s"):
            rejected["no_consent"] += 1
            continue

        if email_lc in seen_emails:
            rejected["dup_intra"] += 1
            continue
        seen_emails.add(email_lc)

        if email_lc in existing_emails:
            rejected["dup_bd"] += 1
            continue

        domain = email_lc.split("@")[-1]
        domain_buckets[domain] = domain_buckets.get(domain, 0) + 1

        first, last = split_name(str(nome or "").strip() or "Sem Nome")

        trainee = {
            "firstName": first[:200],
            "lastName": last[:200],
            "email": email_lc,
            "gender": (str(sexo).strip() or None) if sexo else None,
            "birthDate": parse_birth_date(dnasc),
            "nationality": (str(nacionalidade).strip() or None) if nacionalidade else None,
            "country": derive_country(str(nacionalidade) if nacionalidade else None),
            "nif": (str(cpf).strip() or None) if cpf else None,
            "idType": (str(tipo_id).strip() or None) if tipo_id else None,
            "idNumber": (str(num_id).strip() or None) if num_id else None,
            "address": (str(endereco).strip() or None) if endereco else None,
            "postalCode": (str(cep).strip() or None) if cep else None,
            "city": (str(cidade).strip() or None) if cidade else None,
            "phone": (str(telefone).strip() or None) if telefone and str(telefone).strip() != "0" else None,
            "jobTitle": (str(cargo).strip() or None) if cargo else None,
            "gdprConsent": True,
            "domainKey": domain,
        }
        accepted.append(trainee)

    # Classificar domínios e mapear a client_orgs.
    # Heurística: pessoal/ISP -> NULL; corporate com count>=2 -> client_org;
    # corporate count=1 -> NULL (provavelmente caso isolado ou lixo).
    MIN_TRAINEES_PER_ORG = 2
    corp_domains = []
    domain_to_org_name = {}
    for d, n in sorted(domain_buckets.items(), key=lambda x: -x[1]):
        if d in PERSONAL_DOMAINS:
            domain_to_org_name[d] = None
            continue
        if n < MIN_TRAINEES_PER_ORG:
            domain_to_org_name[d] = None
            continue
        org_name = normalise_domain_to_org_name(d)
        domain_to_org_name[d] = org_name
        corp_domains.append({"domain": d, "name": org_name, "count": n})

    new_client_orgs = []
    seen_org_names = set()
    for cd in corp_domains:
        name_lc = cd["name"].lower()
        if name_lc in existing_org_map:
            continue
        if name_lc in seen_org_names:
            continue
        seen_org_names.add(name_lc)
        new_client_orgs.append({"name": cd["name"], "domainsCovered": [cd["domain"]]})

    # Resolver clientOrgKey nos trainees (nome do client_org; resolve a id no TS)
    for t in accepted:
        d = t.pop("domainKey")
        org_name = domain_to_org_name.get(d)
        t["clientOrgName"] = org_name  # None se pessoal

    plan = {
        "stats": {
            "totalExcel": len(rows),
            "accepted": len(accepted),
            "rejected": rejected,
            "domainsAccepted": len(domain_buckets),
            "newClientOrgsToCreate": len(new_client_orgs),
            "personalDomainTrainees": sum(1 for t in accepted if t["clientOrgName"] is None),
            "corporateDomainTrainees": sum(1 for t in accepted if t["clientOrgName"] is not None),
        },
        "newClientOrgs": new_client_orgs,
        "trainees": accepted,
    }

    PLAN.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(plan["stats"], indent=2, ensure_ascii=False))
    print(f"\nPlan: {PLAN}")
    print(f"\nTop 10 novos client_orgs:")
    for o in new_client_orgs[:10]:
        print(f"  {o['name']} (domain={o['domainsCovered'][0]})")

if __name__ == "__main__":
    main()
