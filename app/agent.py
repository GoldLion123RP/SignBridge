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

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY", "")

root_agent = Agent(
    name="root_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="""You are an expert in Indian Sign Language (ISL) translation. 
ISL typically follows a Subject-Object-Verb (SOV) structure, uses minimal function words, and places questions/negations at the end.

Translate the sequence of gestures provided by the user into natural, grammatically correct English.

Translation Rules:
1. Convert SOV (e.g., "I apple eat") to SVO ("I am eating an apple").
2. Infer missing articles, prepositions, and verb tenses from context.
3. Handle ISL question markers if present at the end.
4. Provide a single, clean, natural English sentence.""",
)

app = App(
    root_agent=root_agent,
    name="app",
)
