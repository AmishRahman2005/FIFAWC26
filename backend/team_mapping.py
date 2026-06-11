# team_mapping.py

# Official 48 teams for FIFA World Cup 2026 with Group, FIFA Code, and flag code (for flagcdn)
TEAMS = {
    # Group A
    "Mexico": {"group": "A", "code": "MEX", "flag": "mx"},
    "South Africa": {"group": "A", "code": "RSA", "flag": "za"},
    "South Korea": {"group": "A", "code": "KOR", "flag": "kr"},
    "Czechia": {"group": "A", "code": "CZE", "flag": "cz"},
    
    # Group B
    "Canada": {"group": "B", "code": "CAN", "flag": "ca"},
    "Qatar": {"group": "B", "code": "QAT", "flag": "qa"},
    "Switzerland": {"group": "B", "code": "SUI", "flag": "ch"},
    "Bosnia and Herzegovina": {"group": "B", "code": "BIH", "flag": "ba"},
    
    # Group C
    "Brazil": {"group": "C", "code": "BRA", "flag": "br"},
    "Morocco": {"group": "C", "code": "MAR", "flag": "ma"},
    "Haiti": {"group": "C", "code": "HAI", "flag": "ht"},
    "Scotland": {"group": "C", "code": "SCO", "flag": "gb-sct"},
    
    # Group D
    "United States": {"group": "D", "code": "USA", "flag": "us"},
    "Paraguay": {"group": "D", "code": "PAR", "flag": "py"},
    "Australia": {"group": "D", "code": "AUS", "flag": "au"},
    "Türkiye": {"group": "D", "code": "TUR", "flag": "tr"},
    
    # Group E
    "Germany": {"group": "E", "code": "GER", "flag": "de"},
    "Curaçao": {"group": "E", "code": "CUW", "flag": "cw"},
    "Ivory Coast": {"group": "E", "code": "CIV", "flag": "ci"},
    "Ecuador": {"group": "E", "code": "ECU", "flag": "ec"},
    
    # Group F
    "Netherlands": {"group": "F", "code": "NED", "flag": "nl"},
    "Japan": {"group": "F", "code": "JPN", "flag": "jp"},
    "Tunisia": {"group": "F", "code": "TUN", "flag": "tn"},
    "Sweden": {"group": "F", "code": "SWE", "flag": "se"},
    
    # Group G
    "Belgium": {"group": "G", "code": "BEL", "flag": "be"},
    "Egypt": {"group": "G", "code": "EGY", "flag": "eg"},
    "Iran": {"group": "G", "code": "IRN", "flag": "ir"},
    "New Zealand": {"group": "G", "code": "NZL", "flag": "nz"},
    
    # Group H
    "Spain": {"group": "H", "code": "ESP", "flag": "es"},
    "Cape Verde": {"group": "H", "code": "CPV", "flag": "cv"},
    "Saudi Arabia": {"group": "H", "code": "KSA", "flag": "sa"},
    "Uruguay": {"group": "H", "code": "URU", "flag": "uy"},
    
    # Group I
    "France": {"group": "I", "code": "FRA", "flag": "fr"},
    "Senegal": {"group": "I", "code": "SEN", "flag": "sn"},
    "Norway": {"group": "I", "code": "NOR", "flag": "no"},
    "Iraq": {"group": "I", "code": "IRQ", "flag": "iq"},
    
    # Group J
    "Argentina": {"group": "J", "code": "ARG", "flag": "ar"},
    "Algeria": {"group": "J", "code": "ALG", "flag": "dz"},
    "Austria": {"group": "J", "code": "AUT", "flag": "at"},
    "Jordan": {"group": "J", "code": "JOR", "flag": "jo"},
    
    # Group K
    "Portugal": {"group": "K", "code": "POR", "flag": "pt"},
    "Colombia": {"group": "K", "code": "COL", "flag": "co"},
    "Uzbekistan": {"group": "K", "code": "UZB", "flag": "uz"},
    "DR Congo": {"group": "K", "code": "COD", "flag": "cd"},
    
    # Group L
    "England": {"group": "L", "code": "ENG", "flag": "gb-eng"},
    "Croatia": {"group": "L", "code": "CRO", "flag": "hr"},
    "Ghana": {"group": "L", "code": "GHA", "flag": "gh"},
    "Panama": {"group": "L", "code": "PAN", "flag": "pa"}
}

# Mapping of various names used in datasets to official standardised names
NAME_MAPPING = {
    "USA": "United States",
    "United States of America": "United States",
    "Korea Republic": "South Korea",
    "Republic of Korea": "South Korea",
    "Korea, Republic of": "South Korea",
    "Czech Republic": "Czechia",
    "Curaçao": "Curaçao",
    "Curacao": "Curaçao",
    "Ivory Coast": "Ivory Coast",
    "Côte d'Ivoire": "Ivory Coast",
    "Cote d'Ivoire": "Ivory Coast",
    "Turkey": "Türkiye",
    "Türkiye": "Türkiye",
    "Cape Verde": "Cape Verde",
    "Cabo Verde": "Cape Verde",
    "DR Congo": "DR Congo",
    "Congo DR": "DR Congo",
    "Democratic Republic of the Congo": "DR Congo",
    "Congo-Kinshasa": "DR Congo",
    "IR Iran": "Iran",
    "Iran, Islamic Republic of": "Iran",
    "Islamic Republic of Iran": "Iran",
    "Saudi Arabia": "Saudi Arabia",
    "Bosnia and Herzegovina": "Bosnia and Herzegovina",
    "Bosnia-Herzegovina": "Bosnia and Herzegovina",
    "Czechia": "Czechia",
    "South Africa": "South Africa"
}

def standardize_team_name(name):
    if not name:
        return name
    name_stripped = name.strip()
    if name_stripped in NAME_MAPPING:
        return NAME_MAPPING[name_stripped]
    return name_stripped
