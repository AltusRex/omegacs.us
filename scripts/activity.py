"""Turn GitHub's contribution calendar (GraphQL response) into the small file the site reads.

Usage: python3 scripts/activity.py <graphql.json> <out.json>
"""
import datetime
import json
import sys

src, out = sys.argv[1], sys.argv[2]
cal = json.load(open(src))["data"]["user"]["contributionsCollection"]["contributionCalendar"]
days = [d for w in cal["weeks"] for d in w["contributionDays"]]
json.dump(
    {
        "from": days[0]["date"],
        "to": days[-1]["date"],
        "source": "github",
        "updated": datetime.date.today().isoformat(),
        "days": [d["contributionCount"] for d in days],
    },
    open(out, "w"),
    separators=(",", ":"),
)
