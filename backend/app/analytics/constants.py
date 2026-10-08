"""Shared constants: group definitions, label maps and the minimum group size."""

MIN_GROUP_SIZE = 20  # groups smaller than this are flagged / excluded from rankings

AGE_GROUPS = ["Under 25", "25–34", "35–44", "45–54", "55+"]
TENURE_GROUPS = ["0–2 years", "3–5 years", "6–10 years", "11–20 years", "21+ years"]
DISTANCE_GROUPS = ["0–5 km", "6–10 km", "11–20 km", "21+ km"]
PROMOTION_GROUPS = ["0–2 years", "3–5 years", "6–10 years", "11+ years"]
EXPERIENCE_GROUPS = ["0–5 years", "6–10 years", "11–20 years", "21+ years"]
INCOME_BANDS = ["Under $3K", "$3K–4.9K", "$5K–7.9K", "$8K–11.9K", "$12K+"]

SATISFACTION_LABELS = {1: "1 – Low", 2: "2 – Medium", 3: "3 – High", 4: "4 – Very High"}
WLB_LABELS = {1: "1 – Bad", 2: "2 – Good", 3: "3 – Better", 4: "4 – Best"}
EDUCATION_LABELS = {1: "1 – Below College", 2: "2 – College", 3: "3 – Bachelor", 4: "4 – Master", 5: "5 – Doctor"}
OVERTIME_LABELS = {"Yes": "Works overtime", "No": "No overtime"}
TRAVEL_LABELS = {"Travel_Frequently": "Travel Frequently", "Travel_Rarely": "Travel Rarely", "Non-Travel": "Non-Travel"}
TRAVEL_ORDER = ["Travel_Frequently", "Travel_Rarely", "Non-Travel"]
