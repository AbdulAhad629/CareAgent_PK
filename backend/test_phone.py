import sys
sys.path.append(".")
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from core.config import settings

prompt = ChatPromptTemplate.from_messages([
    ("system", "Extract name and phone from patient input. Return ONLY JSON: {{\"name\": \"name\", \"phone\": \"03XXXXXXXXX or null\"}}"),
    ("human", "Patient said: {input}")
])

llm = ChatGroq(api_key=settings.GROQ_API_KEY, model=settings.PRIMARY_LLM, temperature=0)
chain = prompt | llm
resp = chain.invoke({"input": "Mera naam Ahmed hai, 25 saal, 03047412646, chest mein dard hai"})
print("Response:", resp.content)