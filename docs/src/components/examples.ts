import { z } from "zod";
import { createAIFn } from "llm-functions-ts";

export const askInvoiceOrQuotesQuestion = createAIFn()
  .output(z.object({ question: z.string().nullable() }))
  .instructions(
    `Answer the following question based on the above invoice.csv.
{question}`
  )
  .create();

export const invoiceFromPdf = createAIFn()
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

export const createGetEmails = () => {
  const getEmailOfSupplier = createAIFn()
    .withModelParams({ temperature: 0.7 })
    .name("Get google keywords from listing")
    .instructions(
      `Attached above is data of a supplier listing. The supplier listing is missing the contact info and your job is to find this missing contact info. To find it, you use google. What keywords you would use to find the contact info of the supplier?`
    )
    .query((supplierId: string) => {
      return Promise.resolve({
        _geoloc: {
          lat: 40.7403942,
          lng: -73.9723695,
        },
        _id: "se7jN4FyE7EfWsovJyCLii",
        _priority: 0,
        _tags: [],
        address: {
          formattedAddress: "500 E 30th St, New York, NY 10016, USA",
          geoloc: {
            lat: 40.7403942,
            lng: -73.9723695,
          },
          info: {
            city: "New York",
            code: "New York",
            country: "United States",
            number: "500",
            postal_code: "10016",
            province: "New York",
            street: "East 30th Street",
          },
          label: "The Water Club",
          neighbourhood: "500 East 30th Street, New York",
        },
        capacity: {
          banquet: 0,
          boardroom: 0,
          cabaret: 0,
          classroom: 0,
          cocktail: null,
          customCapacity: null,
          theatre: 0,
        },
        capacityFeatured: null,
        collectionSource: "planned",
        colors: [],
        company: {
          id: "kniL4f94V5L7aMq3tD2VT4",
          name: "Planned",
        },
        contact: "rMcbf6lyPzglKZ1HbdKSPYBxtIS2",
        description: null,
        dimensions: {
          ceilingHeight: null,
          doorHeight: null,
          doorWidth: null,
        },
        distance: {
          airport: 25,
          subway: 1.4,
        },
        emplacement: null,
        externalSustainabilityCertificates: [],
        extraFees: {
          cleaning: 0,
          setup: 0,
        },
        faqs: [],
        floorPlanLink: null,
        hotel: {
          amenities: [
            "24/7 Front Desk",
            "Breakfast",
            "Housekeeping",
            "Parking",
            "Restaurant",
          ],
          images: [],
          numberOfRooms: 0,
          roomTypes: [],
        },
        images: {
          floorPlan: null,
          space: [],
          venue: [
            "/venue/80f2741742fcda2235510d3ce88021a3-4d7194ef-028d-49e9-bdee-6a0a5c8351e4.jpeg",
          ],
        },
        isActivated: false,
        listingCategories: ["Venue"],
        listingPreview: true,
        meetingPackageId: null,
        name: "River Room",
        onsiteServices: [
          {
            allowExternalService: false,
            chargeExternalService: "no",
            description: "test",
            document: null,
            images: [],
            maxPrice: 0,
            minPrice: 0,
            percent: null,
            pricingModel: null,
            serviceType: "catering",
          },
        ],
        operatingHours: {
          friday: {
            from: "10:00",
            isBusyDay: true,
            to: "18:00",
          },
          monday: {
            from: "10:00",
            isBusyDay: true,
            to: "18:00",
          },
          saturday: {
            from: "10:00",
            isBusyDay: false,
            to: "18:00",
          },
          sunday: {
            from: "10:00",
            isBusyDay: false,
            to: "18:00",
          },
          thursday: {
            from: "10:00",
            isBusyDay: true,
            to: "18:00",
          },
          tuesday: {
            from: "10:00",
            isBusyDay: true,
            to: "18:00",
          },
          wednesday: {
            from: "10:00",
            isBusyDay: true,
            to: "18:00",
          },
        },
        policies: {
          minHours: 0,
        },
        preferredVendors: [],
        price: {
          daily: {
            max: null,
            min: null,
          },
          hourly: {
            max: null,
            min: null,
          },
          minimumSpend: {
            max: null,
            min: null,
          },
          perPerson: {
            max: null,
            min: null,
          },
        },
        priceNotes: null,
        priceOnRequest: true,
        pricingRange: {
          max: null,
          min: 0,
        },
        privacy: null,
        publicInfo: {
          description: "",
          name: null,
        },
        rating: {
          google: 4.4,
          internal: 0,
        },
        resources: {
          additionals: ["Coat check"],
          equipments: ["Display screen(s)", "Sound system(s)"],
          essentials: ["Chairs", "Tables"],
          features: [
            "Basic kitchen(s)",
            "Catering kitchen(s)",
            "Kitchenware",
            "Natural light",
          ],
        },
        score: 20,
        services: {
          alcohol: null,
          audioVideo: null,
          catering: {
            inHouse: true,
          },
          equipment: null,
          staff: null,
        },
        size: 0,
        specializations: null,
        status: "active",
        styles: ["classic"],
        suitableFor: [],
        tags: [],
        type: [
          {
            name: "Buyout",
          },
        ],
        venueId: "rukcYXtCrw2KGBkXyAoZyS",
        venueName: "The Water Club",
        venuePrice: {
          icon: "$$",
          notes: null,
        },
        venueStyles: ["classic"],
        venueTypes: ["General event space"],
        venueVirtualVisit: null,
        virtualVisit: null,
        objectID: "se7jN4FyE7EfWsovJyCLii",
        _highlightResult: {
          address: {
            formattedAddress: {
              value: "500 E 30th St, New York, NY 10016, USA",
              matchLevel: "none",
              matchedWords: [],
            },
            info: {
              city: {
                value: "New York",
                matchLevel: "none",
                matchedWords: [],
              },
            },
          },
          capacity: {
            banquet: {
              value: "0",
              matchLevel: "none",
              matchedWords: [],
            },
            boardroom: {
              value: "0",
              matchLevel: "none",
              matchedWords: [],
            },
            cabaret: {
              value: "0",
              matchLevel: "none",
              matchedWords: [],
            },
            classroom: {
              value: "0",
              matchLevel: "none",
              matchedWords: [],
            },
            theatre: {
              value: "0",
              matchLevel: "none",
              matchedWords: [],
            },
          },
          name: {
            value: "River Room",
            matchLevel: "none",
            matchedWords: [],
          },
          venueId: {
            value: "rukcYXtCrw2KGBkXyAoZyS",
            matchLevel: "none",
            matchedWords: [],
          },
          venueName: {
            value: "The Water Club",
            matchLevel: "none",
            matchedWords: [],
          },
          venuePrice: {
            icon: {
              value: "$$",
              matchLevel: "none",
              matchedWords: [],
            },
          },
          venueTypes: [
            {
              value: "General event space",
              matchLevel: "none",
              matchedWords: [],
            },
          ],
        },
        _rankingInfo: {
          nbTypos: 0,
          firstMatchedWord: 0,
          proximityDistance: 0,
          userScore: 17684,
          geoDistance: 0,
          geoPrecision: 1,
          nbExactWords: 0,
          words: 0,
          filters: 2,
        },
      });
    })
    .output(
      z.object({
        googleSearchKeywords: z
          .string()
          .describe("Keywords to search on google"),
      })
    )
    .dataset([
      { query: "supplierId" },
      { query: "supplierId" },
      { query: "supplierId" },
      { query: "supplierId" },
    ])
    .create();
  return getEmailOfSupplier;
};

export const scrapeSite = createAIFn()
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

const getAnEmail = createAIFn()
  .name("Get an email")
  .instructions("What's a random website of a caterer.")
  .output(z.object({ websiteUrl: z.string() }))
  .map((s) => ({ documents: [s.websiteUrl] }))
  .sequence(scrapeSite)
  .create();

const generateCountryNames = createAIFn()
  .name("A function that generates country names")
  .instructions(
    "Generate countries names that start with {letter}.If the country doesn't exist, make some up"
  )
  .output(z.object({ countryNames: z.array(z.string()) }))
  .create();

export const examples = [
  generateCountryNames,
  getAnEmail,
  scrapeSite,
  createGetEmails(),
  invoiceFromPdf,
  askInvoiceOrQuotesQuestion,
];
