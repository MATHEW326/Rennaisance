import os
from langchain_core.output_parsers import StrOutputParser
from prompts import planner_prompt, writer_prompt, critic_prompt

# Initialize LLM with fallback support
primary_llm = None
fallbacks = []

# Try to initialize Groq
if os.getenv("GROQ_API_KEY"):
    from langchain_groq import ChatGroq
    primary_llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

# Try to initialize Gemini (Google)
if os.getenv("GEMINI_API_KEY"):
    from langchain_google_genai import ChatGoogleGenerativeAI
    gemini_llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
    if not primary_llm:
        primary_llm = gemini_llm
    else:
        fallbacks.append(gemini_llm)

# Try to initialize OpenAI
if os.getenv("OPENAI_API_KEY"):
    from langchain_openai import ChatOpenAI
    openai_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    if not primary_llm:
        primary_llm = openai_llm
    else:
        fallbacks.append(openai_llm)

# Try to initialize Mistral
if os.getenv("MISTRAL_API_KEY"):
    from langchain_mistralai import ChatMistralAI
    mistral_llm = ChatMistralAI(model="mistral-large-latest", temperature=0)
    if not primary_llm:
        primary_llm = mistral_llm
    else:
        fallbacks.append(mistral_llm)

# Default fallback if no keys configured
if not primary_llm:
    from langchain_groq import ChatGroq
    primary_llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

# Bind fallbacks if any are configured
if fallbacks:
    llm = primary_llm.with_fallbacks(fallbacks)
else:
    llm = primary_llm

planner_chain = (
    planner_prompt
    | llm
    | StrOutputParser()
)

writer_chain = (
    writer_prompt
    | llm
    | StrOutputParser()
)

critic_chain = (
    critic_prompt
    | llm
    | StrOutputParser()
)