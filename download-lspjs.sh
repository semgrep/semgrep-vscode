mkdir -p lspjs/dist
for var in "$@"
do
    curl https://static.semgrep.dev/static/turbo/$(cat ./semgrep-version)/language_server/dist/$var -o ./lspjs/dist/$var
done
