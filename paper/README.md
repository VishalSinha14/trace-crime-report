# TRACE research paper

This directory contains the LaTeX manuscript generated from the repository
evidence and the instructions in `latex.md`.

## Files

- `main.tex` — complete manuscript, including diagrams, tables, appendices,
  and an inline bibliography.

## Compile

From this directory, with a standard LaTeX installation:

```powershell
pdflatex main.tex
pdflatex main.tex
```

The second run resolves table-of-contents and cross-reference labels. The
current environment did not provide `pdflatex`, so compilation was not
performed here.

## Important evidence limitations

The repository is a crime-reporting and geospatial incident platform. It does
not contain the ERA5/rainfall/road-network experiment described in the
separate research brief. The paper therefore excludes those claims rather
than fabricating them. It also does not report model accuracy, latency,
usability, fairness, or field-deployment results because corresponding
measurement artifacts were not found.

Before submission:

1. Replace author and affiliation placeholders.
2. Run and archive the functional, security, usability, spatial, and model
   evaluations described in the manuscript.
3. Add only verified citations required by the target venue.
4. Reconcile all endpoint and schema descriptions against the final commit.
5. Have the privacy, ethics, retention, and disclosure statements reviewed
   for the relevant jurisdiction.
