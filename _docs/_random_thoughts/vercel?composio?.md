https://docs.composio.dev/docs/mcp-server-management Right now I need your help thinking through some things. It'll require you to take a look at our agents right now. If you take a look at our agents and how they're currently defined, what you'll see is that we have the capabilities section. This is where we can define our tools as well as our workflows. 

However, in addition to these tools and workflows, we now have another concept from composio which is also called tools. 

That said, we're probably going to need to rethink our nomenclature just a lil bit. 

Originally how I was thinking about tools was having tools basically be our transpiled script that the user can edit and such. 

then I was thinking that workflows are basically combinations of tools that feed into one another.

Now that I'm talking about this out loud, perhaps there are just two layers? I guess in a way I'm trying to think of the heiarchy of things. 

Effectively, I'm thinking that an agent can call either a tool or a workflow?

And I guess maybe there's the idea of custom tools and basic tools? Maybe that's what we have? 

Basic tools are the things that composio gives us out of the box?

And custom tools are the tools that are can be defined by the user? but perhaps custom tools can also invoke basic tools?

This requires a bit more thought.

But perhaps the more critical part of this is, because I want to allow the agent to create agents that can use both basic and custom tools, how does this affect our choice of ai agent framework? Originally, I've been going with the vercel ai agent SDK because it seemed the simplest and most aligned with how I'm thinking about these custom tool definitions and such.
 vercel.com/guides/how-to-build-ai-agents-with-vercel-and-the-ai-sdk 

But now I'm wondering a bit more about whether composio can support using 'custom' tools and 'basic' tools.https://docs.composio.dev/docs/mcp-quickstart 

The way I kinda see this working right now is with composio https://docs.composio.dev/docs/mcp-quickstart  is our agents will basically map to the 'create server configuration' for MCP. that is to say, the basic tools that we let our users try will be that which composio gives us. But it's unclear to me whether or not for this allowedtools param we can allow our 'custom tools'

allowedTools: ["GMAIL_FETCH_EMAILS", "GMAIL_SEND_EMAIL", "GOOGLECALENDAR_EVENTS_LIST"]

But perhaps the allowal of custom tools doesn't need to happen at this level. Perhaps it can start a little bit underneath at the "Use with AI providers" level. Howeber this is where we kinda run into trouble. At least based on the docs, it seems like the only explictly mention 3 https://docs.composio.dev/docs/mcp-providers and the vercel AI sdk isn't included. But I also wonder if its just outdated? The docs, that is. Because if you check out this url, it does look like they support vercel https://www.npmjs.com/package/@composio/vercel

It looks like people are also able to get them compatible?https://www.freecodecamp.org/news/how-to-build-a-google-sheet-ai-agent/ 

It's also making me wonder if I should consider mastra ai instead of the vercel agent ai sdk

And then to make things even more complex, I wonder if composio does support custom tools
https://docs.composio.dev/examples/vercel-chat 


https://docs.composio.dev/docs/custom-tools 

Actually, maybe this is the answer?

Maybe we need to make our custom tools available to composio because its more foundational and the vercel agent SDK is calling composio to know what tools to use?
https://docs.composio.dev/docs/custom-tools 