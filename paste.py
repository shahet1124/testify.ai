import requests
import json
import sys
import os

# Fixed URL for LLM API
LLM_API_URL = os.getenv("LLM_API_URL", "http://10.21.19.17:1234/v1/completions")

def load_figma_data(json_file_path):
    """Load Figma data from a JSON file."""
    try:
        with open(json_file_path, 'r', encoding="utf-8") as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading Figma data: {e}")
        return None

def process_figma_data(data):
    """Extract relevant information for test case generation."""
    processed_data = {"screens": [], "inputs": [], "buttons": []}
    
    for page in data.get("pages", []):
        for frame in page.get("frames", []):
            frame_name = frame.get("frame", "").strip()
            if frame_name and frame_name.lower() != "frame":
                processed_data["screens"].append(frame_name)

            for element in frame.get("elements", []):
                element_name = element.get("name", "").strip().lower()
                if "input" in element_name:
                    processed_data["inputs"].append(element.get("name", "Unnamed Input Field"))
                if "button" in element_name:
                    processed_data["buttons"].append(element.get("name", "Unnamed Button"))

    return processed_data

def generate_playwright_test_cases(processed_data, srs_description):
    """Generate test cases using LLM."""
    prompt = f"""
    You are a QA automation expert. Based on the given Software Requirements Specification (SRS) and Figma design data, generate Playwright test cases in the following structured **text format**:

    Test Case: <Test Case Name>
    Steps:
    1. <Step 1>
    2. <Step 2>
    3. <Step 3>
    Expected Result: <Expected Result>

    ## **Project Information**
    - **SRS Description**: {srs_description}
    - **Screens**: {processed_data['screens']}
    - **Input Fields**: {processed_data['inputs']}
    - **Buttons**: {processed_data['buttons']}

    ## **Guidelines for Test Case Generation**
    1. **Ensure Clarity**: Use a clear and precise step-by-step structure.
    2. **Include Page Navigation**: Mention the screen name where each action is performed.
    3. **Identify UI Elements**: Use actual names (e.g., "Sign Up Button", "Email Input Field").
    4. **Test for Positive & Negative Cases**:
       - **Positive**: Successful user actions (e.g., valid login, successful form submission).
       - **Negative**: Error scenarios (e.g., invalid inputs, missing fields).
    5. **Expected Results**:
       - Specify visible UI changes (e.g., "User should see a success message").
       - Mention redirections (e.g., "User should be redirected to the dashboard").
       - Cover error handling (e.g., "User should see an error message").

    ## **Example Test Cases**
    
    Test Case: Successful User Login
    Steps:
    1. Go to 'Login Page'.
    2. Enter a valid email and password.
    3. Click on 'Login' button.
    Expected Result: User should be redirected to the dashboard.

    Test Case: Login Failure - Invalid Password
    Steps:
    1. Go to 'Login Page'.
    2. Enter a valid email and an incorrect password.
    3. Click on 'Login' button.
    Expected Result: User should see an error message indicating incorrect credentials.

    **Now generate at least 10 relevant test cases in the above text format.**
    """

    payload = {
        "model": "mistral-nemo-instruct-2407",
        "prompt": prompt,
        "max_tokens": 4000,
        "temperature": 0.7
    }

    try:
        response = requests.post(LLM_API_URL, json=payload)
        response.raise_for_status()
        return response.json().get("choices", [{}])[0].get("text", "")
    except requests.exceptions.RequestException as e:
        print(f"Error contacting LLM: {e}")
        return ""

def save_test_cases_as_text(test_cases):
    """Save test cases as a plain text file."""
    try:
        with open("test_cases.txt", 'w', encoding="utf-8") as file:
            file.write(test_cases)
        print(" Test cases saved successfully as 'test_cases.txt'.")
    except Exception as e:
        print(f"Error saving test cases: {e}")

def main():
    """Main function to execute the test case generation pipeline."""
    if len(sys.argv) < 2:
        print("Usage: python script.py <figma_data_file> [srs_summary_file]")
        sys.exit(1)
    
    figma_data_file = sys.argv[1]
    srs_summary_file = sys.argv[2] if len(sys.argv) > 2 else "../NODE_BACKEND/dataintext/summary.txt"

    # Load SRS Summary
    try:
        with open(srs_summary_file, "r", encoding="utf-8") as file:
            srs_description = file.read().strip()
    except Exception as e:
        print(f"Error reading SRS file: {e}")
        sys.exit(1)

    # Load and process Figma data
    figma_data = load_figma_data(figma_data_file)
    if not figma_data:
        print("Failed to load Figma data. Exiting.")
        return
    
    processed_data = process_figma_data(figma_data)

    # Generate test cases from LLM
    text_output = generate_playwright_test_cases(processed_data, srs_description)

    # Save test cases as a plain text file
    save_test_cases_as_text(text_output)

    print(" Process completed successfully!")

if __name__ == "__main__":
    main()