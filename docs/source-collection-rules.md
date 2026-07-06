# SourceRef Collection Rules v0.2

Status: Draft

## Purpose

This document defines the standard procedure for collecting SourceRef documents.

The primary goal is reproducibility.

Different contributors should produce the same dataset from the same primary source.

---

# General Principles

- Always use primary sources whenever possible.
- Never invent document names.
- Never invent English spellings.
- Preserve traceability to the original source.
- Collection and deduplication are separate phases.
- Every collection decision must be reproducible by another contributor.

---

# Source Priority

Priority order:

1. Product Information (PI)
2. Interview Form (IF)
3. Review Report
4. Reexamination Report
5. Reexamination RMP
6. Risk Management Plan (RMP)
7. PMDA Safety Information
8. Safety Case Reports (when published by PMDA)

If a document is not available, record it in notes.md.

For drugs not approved in Japan, use the primary regulatory authority of the approval country instead of PMDA whenever possible.

---

# Folder Structure

references/

    general-name/
        product-name/
            notes.md
            pi_YYYYMMDD.pdf
            if_YYYYMM_vX.pdf
            review_YYYYMMDD.pdf
            reexam_YYYYMMDD.pdf
            reexam-rmp_YYYYMMDD.pdf
            rmp_YYYYMMDD.pdf
            safety_YYYYMMDD.pdf
            safety-case_YYYYMMDD.pdf

---

# Folder Naming

General name

- lowercase
- English generic name
- hyphen/underscore only

Example

tramadol-acetaminophen

Product folder

ProductName_Manufacturer

Manufacturer MUST follow the official English notation found in the primary source.

Priority:

1. PMDA
2. Interview Form (IF)
3. Product Information (PI)
4. Official manufacturer documentation

Do not invent spellings.

Do not normalize spellings.

Use the official notation exactly as published by the primary source.

Examples

toaraset_DSEP
toaraset_JG
toaraset_KMP
toaraset_KYOSOMIRAI
toaraset_Me
toaraset_SANDOZ
toaraset_Nippon-zoki

---

# File Naming

Product Information

pi_YYYYMMDD.pdf

Interview Form

if_YYYYMM_vX.pdf

Review Report

review_YYYYMMDD.pdf

Reexamination Report

reexam_YYYYMMDD.pdf

Reexamination RMP

reexam-rmp_YYYYMMDD.pdf

Risk Management Plan

rmp_YYYYMMDD.pdf

PMDA Safety Information

safety_YYYYMMDD.pdf

PMDA Safety Case Report

safety-case_YYYYMMDD.pdf

---

# Multiple Documents on the Same Day

Append a two-digit suffix.

Example

safety_20120319_01.pdf

safety_20120319_02.pdf

The numbering follows the PMDA presentation order.

---

# Duplicate PMDA Entries

If multiple PMDA entries have:

- identical approval number
- identical YJ code
- identical manufacturer
- identical distributor (if applicable)
- identical document contents

they are treated as one product.

Different PMDA internal IDs alone do not constitute different products.

Document the reason in notes.md.

---

# Missing Documents

If PMDA does not provide a document:

Do not create placeholder files.

Record the absence in notes.md.

Example

PI: Not listed on PMDA

IF: Not listed on PMDA

For drugs not approved in Japan, document the reason and collect primary regulatory documents from the approval country whenever available.

---

# notes.md

notes.md should clearly distinguish:

## Observations

Facts confirmed from primary sources.

## Hypothesis

Unconfirmed assumptions requiring verification.

## Notes

Additional explanations, collection history, or exceptional cases.

Never mix facts with assumptions.

---

# Future Work

- Automated manifest generation
- Duplicate detection
- PDF diff
- Representative document selection
- SourceRef database
- Web review UI
- Automated completeness check
- SourceRef metadata extraction