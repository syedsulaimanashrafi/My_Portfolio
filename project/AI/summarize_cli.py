import os
from urllib.parse import urlparse

from dotenv import load_dotenv
from openai import OpenAI

from scraper import fetch_website_contents


def normalize_url(raw: str) -> str:
    raw = raw.strip()
    if not raw:
        raise ValueError("URL cannot be empty.")
    if not raw.startswith(("http://", "https://")):
        raw = "https://" + raw
    parsed = urlparse(raw)
    if not parsed.netloc:
        raise ValueError("Invalid URL. Example: https://openai.com")
    return raw


def ask_with_default(prompt: str, default: str) -> str:
    value = input(f"{prompt} [{default}]: ").strip()
    return value if value else default


def build_prompts(tone: str, max_sentences: int) -> tuple[str, str]:
    system_prompt = (
        "You analyze website text and create concise summaries. "
        "Ignore navigation-like boilerplate. "
        "Respond in markdown only (no code block)."
    )

    user_prefix = (
        f"Summarize this website in a {tone} tone. "
        f"Keep it under {max_sentences} sentences. "
        "If there are recent events/news, include them. "
        "Ignore historical background unless it is critical to understanding current updates.\n\n"
    )

    return system_prompt, user_prefix


def summarize_url(client: OpenAI, url: str, model: str, tone: str, max_sentences: int) -> str:
    website_text = fetch_website_contents(url)
    system_prompt, user_prefix = build_prompts(tone, max_sentences)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prefix + website_text},
    ]

    response = client.chat.completions.create(model=model, messages=messages)
    return response.choices[0].message.content or "No summary returned."


def main() -> None:
    load_dotenv(override=True)

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("OPENAI_API_KEY not found. Add it to .env and try again.")
        return

    client = OpenAI(api_key=api_key)

    print("Website Summarizer CLI")
    print("Type 'q' at URL prompt to quit.\n")

    while True:
        raw_url = input("Website URL: ").strip()
        if raw_url.lower() in {"q", "quit", "exit"}:
            print("Bye.")
            break

        try:
            url = normalize_url(raw_url)
        except ValueError as exc:
            print(f"Input error: {exc}\n")
            continue

        model = ask_with_default("Model", "gpt-4.1-mini")
        tone = ask_with_default("Tone", "humorous")

        max_sentences_raw = ask_with_default("Max sentences", "10")
        try:
            max_sentences = int(max_sentences_raw)
            if max_sentences < 1 or max_sentences > 30:
                raise ValueError
        except ValueError:
            print("Max sentences must be a number between 1 and 30. Using 10.")
            max_sentences = 10

        print("\nGenerating summary...\n")
        try:
            summary = summarize_url(client, url, model, tone, max_sentences)
            print(summary)
        except Exception as exc:
            print(f"Failed to summarize: {exc}")

        print("\n" + "-" * 70 + "\n")


if __name__ == "__main__":
    main()
