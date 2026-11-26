# Norm extraction tools

Offline tools that read the CBMSC normative instructions (PDF) and dump their tables to JSON. See `client/features/classification/docs/norm-extraction.md` for what they do, the output shape and how to run them.

Their tests run in CI (job `norm-tools`) and locally with `pip install -r requirements.txt` and `python -m unittest discover -p "test_*.py"` from this folder.
