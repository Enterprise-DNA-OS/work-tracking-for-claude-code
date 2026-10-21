# Records checks and their sources

Checked 21 October 2026. These checks flag missing review evidence for an operator. They do not establish legal compliance, inspect security controls or select a lawful retention period.

| Rule | Source | Implemented check |
|---|---|---|
| NZ-IPP5 | [NZ Privacy Commissioner, principle 5](https://www.privacy.org.nz/privacy-principles/5/) | Project access review is missing or past its operator-set review date. Record the review evidence and next date with review-access. |
| NZ-IPP9 | [NZ Privacy Commissioner, principle 9](https://www.privacy.org.nz/privacy-principles/9/) | A closed project's retention review is missing or past its operator-set date. Record the purpose for retention and next review with review-retention. Nothing is deleted automatically. |
| HOUSE-OWNER | Internal operating rule in this project | Open tasks need an active owner. This is not a statute. |
| HOUSE-DATE | Internal operating rule in this project | Open tasks need a due date. This is not a statute. |

Principle 5 requires reasonable safeguards for personal information. Principle 9 limits retention to the period required for a lawful purpose. Neither sets the review intervals in this tool. An operator chooses them and records what was actually reviewed. The report names the source on every finding.

The free version assumes one trusted operator. Protect the machine, database credentials, backups and rendered files. Database row security and revoked public grants keep anonymous database roles out; the owner account can read everything. There is no authenticated application audit trail or permission inheritance from Smartsheet. Actor names are entered labels. Review access design before shared use.

For Australian deployments, configure the applicable privacy and retention obligations with the organisation's adviser. The two NZ checks are labelled by jurisdiction and do not claim to implement Australian law.
