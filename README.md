# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code goes here
`package.json` | project metadata and configuration
`readme.md` | this getting started guide

## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).

## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

## Menu Extraction (Gemini)

The action `POST /odata/v4/lunch/extractMenuFromImage` calls the Gemini API and requires `GEMINI_API_KEY`.

- Local dev: set `GEMINI_API_KEY=...` in `.env` (loaded via `dotenv`).
- Cloud Foundry deploy: `.env` is typically not deployed, so set it as an app environment variable, then restage:
  - `cf set-env <srv-app-name> GEMINI_API_KEY <your-key>`
  - `cf restage <srv-app-name>`
