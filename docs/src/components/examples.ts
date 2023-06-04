import { z } from "zod";
import { initLLmFunction } from "llm-functions-ts";

const { llmFunction, registry } = initLLmFunction({
  saveLog: (e) => {
    if (typeof window !== "undefined") {
      const prevLogs =
        JSON.parse(localStorage?.getItem("llm-functions-logs") || "null") || [];
      localStorage?.setItem(
        "llm-functions-logs",
        JSON.stringify([...prevLogs, e])
      );
    }
  },
  getLogs: () => {
    if (typeof window !== "undefined") {
      return (
        JSON.parse(localStorage?.getItem("llm-functions-logs") || "null") || []
      );
    } else {
      return [];
    }
  },
});

export const invoiceFromPdf = llmFunction
  .name("Invoice from PDF")
  .description("Takes an invoice and returns the line items")
  .document({ type: "pdf" })
  .output(
    z.object({
      subtotal: z.number().nullable(),
      taxes: z.array(
        z.object({ name: z.string().nullable(), amount: z.number().nullable() })
      ),
      total: z.number().nullable(),
      lineItems: z.array(
        z.object({
          description: z.string().nullable(),
          date: z.string().nullable(),
          activity: z.string().nullable(),
          item_amount: z.number().nullable(),
          item_amount_total: z.number().nullable(),
          quantity: z.number().default(1).nullable(),
          tax: z
            .string()
            .nullable()
            .describe(
              "Name of the tax. Can be GST/HST, Nola tax etc. It is not the tax amount"
            ),
        })
      ),
    })
  )
  .create();

export const scrapeSite = llmFunction
  .name("Get contact info from website")
  .instructions(
    `Follow these instructions to the dor get the contact info from the website. Let's work this out in a step by step way to be sure we have the right answer
1. Look for an email from the Document attached above
2. If you cannot find the email, then find the contact page from the Document attached above.
3. Otherwise return "not found
Do not output the email if it doesn't exist in the Document. See examples below.
Do not make up the email. DO not hallucinate.
EXAMPLES: 

DOCUMENT: <html><body><p>hello</p><a href="/contact">Contact</a></body></html>
OUTPUT: {{
  "steps": [
    "Looking for the email in the document",
    "Email not found",
    "Looking for the contact page in the document",
    "Found the contact page",
    "Contact page is /contact"
  ],
  "finalResponse": {{ "type": "contactUrl", "data": "/contact" }}
}}
`
  )
  .document({ type: "url", chunkingQuery: "Contact info" })
  .dataset([
    {
      documents: ["https://avecplaisirs.com"],
    },
    {
      documents: ["https://nycateringservice.com/"],
    },
    {
      documents: ["https://relishcaterers.com/corporate/"],
    },
  ])
  .output(
    z.object({
      steps: z.array(z.string()),
      finalResponse: z.union([
        z.object({ type: z.literal("email"), data: z.string() }),
        z.object({ type: z.literal("contactUrl"), data: z.string() }),
      ]),
    })
  )
  .create();

const getAnEmail = llmFunction
  .withModelParams({ temperature: 0.8 })
  .name("Get an email")
  .instructions("What's a random website of a caterer.")
  .output(z.object({ websiteUrl: z.string() }))
  .map((s) => {
    return { documents: ['https://www.cateringbyseasons.com/'] satisfies [string] };
  })
  .sequence(scrapeSite)
  .create();

const poem = llmFunction
  .withModelParams({ temperature: 0.8 })
  .name("Poet")
  .instructions("Write a poem")
  .output(z.object({ poem: z.string() }))
  .create();

export { registry };
