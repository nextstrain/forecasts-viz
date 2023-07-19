set -eou pipefail
mkdir -p data;
PREFIX="https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov"
curl --compressed "${PREFIX}/gisaid/nextstrain_clades/global/renewal/latest_results.json" --output data/clades.renewal.json;
curl --compressed "${PREFIX}/gisaid/nextstrain_clades/global/mlr/latest_results.json" --output data/clades.mlr.json;
curl --compressed "${PREFIX}/gisaid/pango_lineages/global/mlr/latest_results.json" --output data/lineages.mlr.json;
