import { Execution } from "llm-functions-ts";

export const exampleLogs: Execution<any>[] = [
  {
    id: 'xtYHrTHyWaLGHbOIF1s2m',
    trace: [
      {
        action: 'calling-open-ai',
        template:
          'JSON SCHEMA:"""\n{"type":"array","items":{"type":"object","properties":{"time":{"type":"string"},"title":{"type":"string","description":"The title is alliterative"}},"required":["time","title"],"additionalProperties":false}}\n  \n"""\nTASK:"""\nOutput a json object or array fitting this schema, based on the PROMPT section below. Use the DOCUMENT section above to answer the prompt.\nCode only, no commentary, no introduction sentence, no codefence block.\nYou are generating json - make sure to escape any double quotes.\nDo not hallucinate or generate anything that is not in the document.\nMake sure your answer fits the schema.\n\n  \nIf you are not sure or cannot generate something for any possible reason, return:\n{"error" : <the reason of the error>};\n"""\nPROMPT:"""\nI want to create an agenda slide based on the agenda data. The titles are alliterative\nA\n"""',
        response: {
          type: 'success',
          output: '\n[{"time": "9:00", "title": "Astonishing Aardvarks"}]',
        },
        id: 'uZV4E543yyrHHmQ4TL-z_',
      },
    ],
    inputs: {
      instructions: {
        agendaData: 'A',
      },
    },
    finalResponse: [
      {
        time: '9:00',
        title: 'Astonishing Aardvarks',
      },
    ],
  },
  {
    id: 'Yn1vWxHOkpvMEz87wqfbR',
    trace: [
      {
        action: 'calling-open-ai',
        template:
          'JSON SCHEMA:"""\n{"type":"array","items":{"type":"object","properties":{"time":{"type":"string"},"title":{"type":"string","description":"The title is alliterative"}},"required":["time","title"],"additionalProperties":false}}\n  \n"""\nTASK:"""\nOutput a json object or array fitting this schema, based on the PROMPT section below. Use the DOCUMENT section above to answer the prompt.\nCode only, no commentary, no introduction sentence, no codefence block.\nYou are generating json - make sure to escape any double quotes.\nDo not hallucinate or generate anything that is not in the document.\nMake sure your answer fits the schema.\n\n  \nIf you are not sure or cannot generate something for any possible reason, return:\n{"error" : <the reason of the error>};\n"""\nPROMPT:"""\nI want to create an agenda slide based on the agenda data. The titles are alliterative\nB\n"""',
        response: {
          type: 'success',
          output:
            '\n[{"time": "9:00", "title": "Big Beginnings"}, {"time": "9:30", "title": "Budding Breakthroughs"}, {"time": "10:00", "title": "Bold Bounties"}]',
        },
        id: 'rHvBFx5Rol0F1ZRITLsAe',
      },
    ],
    inputs: {
      instructions: {
        agendaData: 'B',
      },
    },
    finalResponse: [
      {
        time: '9:00',
        title: 'Big Beginnings',
      },
      {
        time: '9:30',
        title: 'Budding Breakthroughs',
      },
      {
        time: '10:00',
        title: 'Bold Bounties',
      },
    ],
  },
  {
    id: '3IPGyJ_VkF1ZUqMapWfHW',
    trace: [
      {
        action: 'calling-open-ai',
        template:
          'JSON SCHEMA:"""\n{"type":"array","items":{"type":"object","properties":{"time":{"type":"string"},"title":{"type":"string","description":"The title is alliterative"}},"required":["time","title"],"additionalProperties":false}}\n  \n"""\nTASK:"""\nOutput a json object or array fitting this schema, based on the PROMPT section below. Use the DOCUMENT section above to answer the prompt.\nCode only, no commentary, no introduction sentence, no codefence block.\nYou are generating json - make sure to escape any double quotes.\nDo not hallucinate or generate anything that is not in the document.\nMake sure your answer fits the schema.\n\n  \nIf you are not sure or cannot generate something for any possible reason, return:\n{"error" : <the reason of the error>};\n"""\nPROMPT:"""\nI want to create an agenda slide based on the agenda data. The titles are alliterative\nC\n"""',
        response: {
          type: 'success',
          output:
            '\n[{"time":"9:00am","title":"Clocking in Conference"},{"time":"9:15am","title":"Coffee and Connecting"},{"time":"9:30am","title":"Crisp Conversation"},{"time":"10:00am","title":"Culmination Celebration"}]',
        },
        id: 'jan5fUTq0S-_zcEz7i5uH',
      },
    ],
    inputs: {
      instructions: {
        agendaData: 'C',
      },
    },
    finalResponse: [
      {
        time: '9:00am',
        title: 'Clocking in Conference',
      },
      {
        time: '9:15am',
        title: 'Coffee and Connecting',
      },
      {
        time: '9:30am',
        title: 'Crisp Conversation',
      },
      {
        time: '10:00am',
        title: 'Culmination Celebration',
      },
    ],
  },
];
