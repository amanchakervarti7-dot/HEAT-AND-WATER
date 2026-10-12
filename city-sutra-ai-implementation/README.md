# CitySutra AI

CitySutra AI is a Delhi-first urban climate action twin: a working evidence layer, deterministic Civic Action Priority engine, citizen report workflow, impact calculator, and explicit demo fallback.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The app starts in labeled local demonstration mode. It may call Open-Meteo from the browser/server adapter; if a provider request fails, the UI keeps the seeded snapshot and explains why. Demo reports persist in browser storage only.

## Routes

`/`, `/map`, `/actions`, `/report`, `/incidents`, `/impact`, `/methodology`, `/api/health`, `/api/snapshot`.

## Architecture

```text
Next.js / AWS Amplify Hosting
          |
          | optional NEXT_PUBLIC_API_BASE_URL
          v
API Gateway HTTP API -> Lambda -> DynamoDB (incident records)
          ^
          |
Open-Meteo public air-quality + weather adapters (forecast/model data)
```

The included `template.yaml` creates the resources described by the AWS architecture: an HTTP API Gateway API, a Lambda processor, an on-demand DynamoDB incidents table, a private encrypted S3 data bucket for environmental/geospatial inputs, and a 30-day CloudWatch log group. `backend/handler.js` uses the Lambda execution role and never exposes AWS credentials. Amazon Bedrock is intentionally not provisioned: recommendations remain deterministic and auditable unless a future, explicitly approved Bedrock adapter is added. The local Next.js UI does not require AWS to demonstrate the product.

## Deploy only after confirmation

These commands are exact for the resources in this repository. They create billable AWS resources, so do not run them without explicit confirmation.

```bash
cd /vercel/share/v0-project
pnpm install
cd backend && npm install && cd ..
aws configure                         # use your local AWS profile; never commit credentials
sam build
sam deploy --guided                    # choose region, stack name, confirm changes
aws cloudformation describe-stacks --stack-name <STACK_NAME> --query 'Stacks[0].Outputs'
```

Copy the `ApiUrl` output into `NEXT_PUBLIC_API_BASE_URL` for the frontend. For AWS Amplify Hosting, connect this repository in the Amplify console, set the build command to `pnpm build`, set the app environment variable `NEXT_PUBLIC_API_BASE_URL` to the API output, and deploy. The Amplify build must use Node 20+ and pnpm.

No AWS resource has been deployed by this project. No deployment URL is claimed. The SAM template's CORS is permissive for a hackathon starting point; tighten `AllowOrigins` to the Amplify domain before production. Add API Gateway throttling and CloudWatch alarms before public launch.

## Demo script

1. Open `/` and observe European AQI 146, 39°C apparent temperature, 76% rain probability, and their provider/freshness labels.
2. Confirm the waste-burning and drain incidents are labeled `SIMULATED`; the UI never calls them detected hotspots.
3. Open `/actions` and inspect score components, evidence, missing dimensions, and human next step. Use **Advance lifecycle**.
4. Open `/incidents`, select an incident, then move it through reviewed, assigned, resolved.
5. Open `/report`, submit a valid report, and verify the confirmation warns that it is local-only.
6. Open `/impact`, change diversion or route assumptions and observe estimates recompute. These are scenario estimates, not measured outcomes.
7. Remove/disable a signal in the code/test harness or let Open-Meteo fail; missing dimensions are excluded and remaining weights renormalize rather than becoming zero.
8. Use **Reset demo** to restore the reproducible scenario.

## Trust notes

Open-Meteo forecast/model values are not street-level sensor measurements and European AQI is never relabeled as India's National AQI. CPCB reference: https://airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf. Delhi Jal Board complaint route: https://delhijalboard.delhi.gov.in/jalboard/important-phone-numbers-complaints-redressal. Recommendations never automatically notify an authority.

## Cleanup

After a confirmed deployment, delete the SAM CloudFormation stack and disconnect/delete the Amplify app. This removes the DynamoDB table and stops ongoing charges according to the selected AWS billing model.
