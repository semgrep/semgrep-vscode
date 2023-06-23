from cryptography.hazmat.primitives import hashes

### Secret detection
# ruleid: detected-amazon-mws-auth-token
TOKEN="amzn.mws.00a19111-8311-5311-5391-5e211cbfcd5c"

### Try autofixing me!
# ruleid:insecure-hash-algorithm-md5
hashes.SHA1()

### Ignore a finding
# ruleid:insecure-hash-algorithm-md5
hashes.SHA1() # nosem (this line is fine)


### ═══════════════════ ✨ Hope you enjoy using Semgrep! ✨ ═══════════════════ ###

# To access all commands, just click Semgrep [ooo] in the bottom right.

# By default, the extension uses the p/default ruleset,
# which is a combination of recommended security and best practices rules for many languages.

# You can modify which rules are running in Semgrep Cloud Platform.
# Try it free by signing up at semgrep.dev!
