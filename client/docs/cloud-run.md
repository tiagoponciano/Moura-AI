# Cloud Run deploy

How the PDF and DWG services run on Google Cloud Run and how the app calls them. For whoever publishes or operates them. Describes the setup as it is now.

## What this is

`services/pdf` (Gotenberg with LibreOffice) and `services/dwg` run as two Cloud Run services, `moura-pdf` and `moura-dwg`, in `us-central1`, built from source with `gcloud run deploy --source`. They scale to zero, so the first call after a pause takes a few seconds, and they are capped at two instances.

Invariants:

- **The services are private.** Only the app's Google service account may call them (role `roles/run.invoker`); nobody else gets past Google's front door.
- **Cloud Run reads `Authorization` as its own token.** A public service that receives a `Basic` or a foreign `Bearer` header answers a Google 401 page before the service is reached, so the app never sends its own password in that header. It sends Google's identity token there (`lib/google-identity.ts`), and the DWG service's own token in `X-Service-Token`.
- **The same code runs locally.** Without `GOOGLE_SERVICE_ACCOUNT_JSON` the app sends Basic credentials to the PDF service and `Authorization: Bearer` to the DWG service, as a local Docker expects.

## The service account

```
gcloud iam service-accounts create moura-app --display-name "Moura AI (Vercel)"
SA=moura-app@moura-engenharia.iam.gserviceaccount.com
gcloud run services add-iam-policy-binding moura-pdf --region us-central1 --member=serviceAccount:$SA --role=roles/run.invoker
gcloud run services add-iam-policy-binding moura-dwg --region us-central1 --member=serviceAccount:$SA --role=roles/run.invoker
gcloud iam service-accounts keys create "$HOME/moura-app-key.json" --iam-account=$SA
```

The key file's content goes into `GOOGLE_SERVICE_ACCOUNT_JSON` on Vercel, and the file is then deleted from the computer. Public access, if it was ever on, is removed with `gcloud run services remove-iam-policy-binding <service> --region us-central1 --member=allUsers --role=roles/run.invoker`.

## Publishing

From the repository root, with `DWG_TOKEN` set in the shell (`export DWG_TOKEN=$(openssl rand -hex 24)`):

```
gcloud run deploy moura-pdf --source services/pdf --region us-central1 \
  --memory 2Gi --cpu 1 --min-instances 0 --max-instances 2 --timeout 60 \
  --no-allow-unauthenticated --set-env-vars PDF_BASIC_AUTH=false

gcloud run deploy moura-dwg --source services/dwg --region us-central1 \
  --memory 1Gi --cpu 1 --min-instances 0 --max-instances 2 --timeout 60 \
  --no-allow-unauthenticated --set-env-vars DWG_SERVICE_TOKEN=$DWG_TOKEN
```

`PDF_BASIC_AUTH=false` turns off Gotenberg's own password, since Google checks the caller. The first DWG build compiles LibreDWG and takes several minutes.

## App environment (Vercel)

| Variable                      | Value                                          |
| ----------------------------- | ---------------------------------------------- |
| `PDF_SERVICE_URL`             | The URL of `moura-pdf`, with no trailing slash |
| `DWG_SERVICE_URL`             | The URL of `moura-dwg`, with no trailing slash |
| `DWG_SERVICE_TOKEN`           | The `DWG_TOKEN` used above                     |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The content of the service account key file    |
| `NEXT_PUBLIC_PDF_ENABLED`     | `true` to show the PDF actions                 |

`PDF_SERVICE_USER` and `PDF_SERVICE_PASSWORD` are not read when `GOOGLE_SERVICE_ACCOUNT_JSON` is set. Vercel applies new variables only to new deploys, so redeploy after changing them.

## What this does NOT do

- **No spend control by itself.** A budget with a spend cap for Cloud Run is set in the console (Billing, Budgets); when it is reached the services stop until the next month.
- **The key file is a secret.** Anyone with it can call both services; rotate it by creating a new key and deleting the old one.
- **Not tried end to end on Cloud Run.** Locally, the images and the two modes of authentication were checked; the call from Vercel with the identity token has not been seen working.
