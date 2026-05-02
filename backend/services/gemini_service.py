# SignBridge AI - Google Gemini API Integration Service

import os
from google import genai
from google.genai import types
from typing import List, Dict, Optional, Union
import json

class GeminiService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.client = None
        self._initialize_client()

        # Configuration
        self.model = "gemini-1.5-flash"
        self.max_tokens = 2048
        self.temperature = 0.7
        self.top_p = 0.9

    def _initialize_client(self):
        """Initialize the Google GenAI client."""
        if not self.api_key:
            raise ValueError("Gemini API key not provided. Set GEMINI_API_KEY environment variable or pass api_key parameter.")

        try:
            self.client = genai.Client(api_key=self.api_key)
            print("Gemini client initialized successfully")
        except Exception as e:
            print(f"Error initializing Gemini client: {e}")
            raise

    def structure_sentence(self, words: List[str]) -> Optional[str]:
        """Structure a list of words into a grammatically correct sentence."""
        if not words:
            return None

        prompt = f"""You are a helpful writing assistant. Structure these words into a grammatically correct, natural-sounding sentence:

Words: {words}

Please create a coherent sentence that makes sense in context. If the words don't form a complete thought, return None."""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                prompt=prompt,
                temperature=self.temperature,
                top_p=self.top_p,
                max_tokens=self.max_tokens
            )

            return response.candidates[0].content if response.candidates else None

        except Exception as e:
            print(f"Error structuring sentence: {e}")
            return None

    def translate_sign_to_text(self, gestures: List[str], context: str = "") -> Optional[str]:
        """Translate a sequence of sign language gestures into text, handling ISL's SOV structure."""
        if not gestures:
            return None

        prompt = f"""You are an expert in Indian Sign Language (ISL) translation. 
ISL typically follows a Subject-Object-Verb (SOV) structure, uses minimal function words, and places questions/negations at the end.

Translate this sequence of gestures into natural, grammatically correct English:

Gestures (SOV order): {', '.join(gestures)}

Context: {context}

Translation Rules:
1. Convert SOV (e.g., "I apple eat") to SVO ("I am eating an apple").
2. Infer missing articles, prepositions, and verb tenses from context.
3. Handle ISL question markers if present at the end.
4. Provide a single, clean, natural English sentence.

Translation:"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3, # Lower temperature for translation accuracy
                    top_p=self.top_p,
                    max_output_tokens=self.max_tokens
                )
            )

            return response.text if response.text else None

        except Exception as e:
            print(f"Error translating gestures: {e}")
            return None

    def generate_response(self, user_input: str, system_prompt: str = "") -> Optional[str]:
        """Generate a response for conversational AI features."""
        if not user_input:
            return None

        prompt = f"""System prompt: {system_prompt}

User: {user_input}

SignBridge AI:"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                prompt=prompt,
                temperature=self.temperature,
                top_p=self.top_p,
                max_tokens=self.max_tokens
            )

            return response.candidates[0].content if response.candidates else None

        except Exception as e:
            print(f"Error generating response: {e}")
            return None

    def analyze_sentiment(self, text: str) -> Optional[Dict[str, float]]:
        """Analyze sentiment of text (positive, negative, neutral)."""
        if not text:
            return None

        prompt = f"""Analyze the sentiment of this text and provide a confidence score for each sentiment category:

Text: {text}

Please return a JSON object with sentiment scores for positive, negative, and neutral sentiments, each between 0 and 1, summing to 1.

Example output: {"positive": 0.8, "negative": 0.1, "neutral": 0.1}"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                prompt=prompt,
                temperature=0.0,  # Lower temperature for consistent output
                top_p=1.0,
                max_tokens=200
            )

            # Parse JSON response
            try:
                result = json.loads(response.candidates[0].content)
                return result if isinstance(result, dict) else None
            except json.JSONDecodeError:
                return None

        except Exception as e:
            print(f"Error analyzing sentiment: {e}")
            return None

    def close(self):
        """Close the Gemini client connection."""
        if self.client:
            # No explicit close method in GenAI client, but we can clean up
            self.client = None
            print("Gemini client closed")
