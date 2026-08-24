# Genezio

> Deploy Nitro apps to Genezio.

**Preset:** `genezio`

<read-more></read-more>

> [!IMPORTANT]
> 🚧 This preset is currently experimental.

## 1. Project Setup

Create `genezio.yaml` file:

```yaml
# The name of the project.
name: nitro-app
# The version of the Genezio YAML configuration to parse.
yamlVersion: 2
backend:
  # The root directory of the backend.
  path: .output/
  # Information about the backend's programming language.
  language:
      # The name of the programming language.
      name: js
      # The package manager used by the backend.
      packageManager: npm
  # Information about the backend's functions.
  functions:
      # The name (label) of the function.
      - name: nitroServer
      # The path to the function's code.
        path: server/
        # The name of the function handler
        handler: handler
        # The entry point for the function.
        entry: index.mjs
```

<read-more>

To further customize the file to your needs, you can consult the
[official documentation](https://genezio.com/docs/project-structure/genezio-configuration-file/).
</read-more>

## 2. Deploy your project

Build with the genezio nitro preset:

```bash
NITRO_PRESET=genezio npm run build
```

Deploy with [`genezio`](https://npmjs.com/package/genezio) cli:

<pm-x></pm-x>

<read-more>

To set environment viarables, please check out [Genezio - Environment Variables](https://genezio.com/docs/project-structure/backend-environment-variables).
</read-more>

## 3. Monitor your project

You can monitor and manage your application through the [Genezio App Dashboard](https://app.genez.io/dashboard). The dashboard URL, also provided after deployment, allows you to access comprehensive views of your project's status and logs.
