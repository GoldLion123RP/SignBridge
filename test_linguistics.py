import os
import asyncio
from app.agent import root_agent

async def test_translation(input_text, expected_output):
    print(f"Input: {input_text}")
    print(f"Expected: {expected_output}")
    try:
        # root_agent is an ADK Agent. We can use its run method or similar.
        # Based on ADK docs, agents have a 'run' method or we can use the model directly.
        # Since I want to test the instruction, I'll use the root_agent.
        response = await root_agent.run(input_text)
        actual_output = response.text.strip()
        print(f"Actual: {actual_output}")
        if actual_output.lower().rstrip('.') == expected_output.lower().rstrip('.'):
            print("RESULT: PASS")
        else:
            print("RESULT: FAIL")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)

async def main():
    test_cases = [
        ("HELLO", "Hello."),
        ("I, APPLE, EAT", "I am eating an apple."),
        ("WATER, WANT", "I want water."),
        ("YOU, NAME, WHAT", "What is your name?")
    ]
    
    for input_text, expected_output in test_cases:
        await test_translation(input_text, expected_output)

if __name__ == "__main__":
    asyncio.run(main())
