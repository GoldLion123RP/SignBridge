# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types
from dotenv import load_dotenv

# Load env from root
load_dotenv(".env.local")

api_key = os.environ.get("GEMINI_API_KEY")

root_agent = Agent(
    name="root_agent",
    model=Gemini(
        model="gemini-1.5-flash",
        api_key=api_key,
        retry_options=types.HttpRetryOptions(attempts=3),
        config=types.GenerateContentConfig(
            temperature=0,
            top_p=0.95,
        ),
    ),
    instruction="""You are an expert in Indian Sign Language (ISL) translation. 
Your task is to convert a sequence of ISL gestures into natural, grammatically correct English.

Context:
- ISL structure: Subject-Object-Verb (SOV).
- Minimal use of function words (is, am, are, to, the).
- Questions and negations often appear at the end.

Translation Guidelines:
1. SVO Conversion: Convert "I apple eat" → "I am eating an apple."
2. Tense Inference: Use context to determine if the action is past, present, or future.
3. Natural Flow: Add necessary articles (a, an, the) and prepositions.
4. Clean Output: Provide ONLY the translated English sentence. No explanations.

Example:
Input: ["Hello", "I", "Name", "Rahul"]
Output: Hello, my name is Rahul.""",
)

app = App(
    root_agent=root_agent,
    name="app",
)
