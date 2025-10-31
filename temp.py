import requests
import json
import sys

# Fixed URL for LLM API
LLM_API_URL = "http://10.21.19.17:1234/v1/completions"

def load_figma_data(json_file_path):
    """Load Figma data from a JSON file."""
    try:
        with open(json_file_path, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading Figma data: {e}")
        return None

def process_figma_data(data):
    """Extract relevant information for test case generation."""
    processed_data = {"screens": [], "inputs": [], "buttons": []}
    for page in data.get("pages", []):
        for frame in page.get("frames", []):
            frame_name = frame.get("frame", "")
            if frame_name and frame_name != "Frame":
                processed_data["screens"].append(frame_name)
            for element in frame.get("elements", []):
                element_name = element.get("name", "").lower()
                if "input" in element_name:
                    processed_data["inputs"].append(element_name)
                if "button" in element_name:
                    processed_data["buttons"].append(element_name)
    return processed_data

def generate_playwright_test_cases(processed_data, srs_description):
    """Generate test cases using LLM."""
    prompt = f"""
    You are a QA automation expert. Generate Playwright test cases based on this data:
    
    SRS: {srs_description}
    Screens: {processed_data['screens']}
    Inputs: {processed_data['inputs']}
    Buttons: {processed_data['buttons']}
    
    Format:
    Test Case: [name]
    Steps:
    - [action] on [element]
    Expected Result: [result]
    """
    
    payload = {"model": "mistral-nemo-instruct-2407", "prompt": prompt, "max_tokens": 4000, "temperature": 0.7}
    try:
        response = requests.post(LLM_API_URL, json=payload)
        response.raise_for_status()
        return response.json().get("choices", [{}])[0].get("text", "")
    except requests.exceptions.RequestException as e:
        print(f"Error contacting LLM: {e}")
        return ""

def parse_test_cases(text_output):
    """Convert LLM text output into structured JSON test cases."""
    test_cases = []
    sections = text_output.split("Test Case: ")
    for section in sections[1:]:
        lines = section.split("\n")
        case = {"testCase": lines[0].strip(), "steps": [], "expectedResult": ""}
        for line in lines[1:]:
            if "- " in line:
                case["steps"].append(line.strip("- ").strip())
            elif "Expected Result:" in line:
                case["expectedResult"] = line.split(":", 1)[-1].strip()
        test_cases.append(case)
    return test_cases if test_cases else [{"testCase": "Sample", "steps": ["No data"], "expectedResult": "Error parsing output"}]

def save_test_cases(test_cases):
    """Save test cases to a JSON file."""
    try:
        with open("test_cases.json", 'w') as file:
            json.dump(test_cases, file, indent=2)
        print("Test cases saved successfully!")
    except Exception as e:
        print(f"Error saving test cases: {e}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py <figma_data_file> [srs_summary_file]")
        sys.exit(1)
    
    figma_data_file = sys.argv[1]
    srs_summary_file = sys.argv[2] if len(sys.argv) > 2 else "../NODE_BACKEND/dataintext/summary.txt"
    
    try:
        with open(srs_summary_file, "r", encoding="utf-8") as file:
            srs_description = file.read().strip()
    except Exception as e:
        print(f"Error reading SRS file: {e}")
        sys.exit(1)
    
    figma_data = load_figma_data(figma_data_file)
    if not figma_data:
        print("Failed to load Figma data. Exiting.")
        return
    
    processed_data = process_figma_data(figma_data)
    raw_output = generate_playwright_test_cases(processed_data, srs_description)
    test_cases = parse_test_cases(raw_output)
    save_test_cases(test_cases)
    print("Process completed successfully!")

if __name__ == "__main__":
    main()
    
    
# import requests
# import json
# import os
# import sys
# from datetime import datetime

# # Fixed URL for LLM API as provided
# LLM_API_URL = "http://10.21.19.17:1234/v1/completions"


# def load_figma_data(json_file_path):
#     """Load Figma data from a JSON file."""
#     try:
#         with open(json_file_path, 'r') as file:
#             return json.load(file)
#     except Exception as e:
#         print(f"Error loading Figma data from file: {e}")
#         return None


# def process_figma_data(data):
#     """Process the Figma data to extract relevant information for test case generation."""
#     processed_data = {"screens": [], "components": [], "inputs": [], "buttons": []}
    
#     for page in data.get("pages", []):
#         page_name = page.get("page", "")
        
#         for frame in page.get("frames", []):
#             frame_name = frame.get("frame", "")
#             description = frame.get("description", "")
            
#             if frame_name and frame_name != "Frame":
#                 processed_data["screens"].append({
#                     "name": frame_name,
#                     "page": page_name,
#                     "description": description if description != "No text available" else ""
#                 })
            
#             for element in frame.get("elements", []):
#                 element_type = element.get("type", "")
#                 element_name = element.get("name", "")
#                 element_category = element.get("category", "")
                
#                 if element_category == "Input Field" or "input" in element_name.lower():
#                     processed_data["inputs"].append({"name": element_name, "screen": frame_name, "page": page_name})
#                 if element_category == "Button" or element_type == "BUTTON" or "button" in element_name.lower():
#                     processed_data["buttons"].append({"name": element_name, "screen": frame_name, "page": page_name})
#                 if element_name and element_type:
#                     processed_data["components"].append({
#                         "name": element_name,
#                         "type": element_type,
#                         "category": element_category,
#                         "screen": frame_name,
#                         "page": page_name
#                     })
#     return processed_data


# def generate_playwright_test_cases(processed_data, srs_description):
#     """Generate test cases formatted for Playwright using the local LLM."""
#     prompt = f"""
# You are a QA automation expert tasked with creating Playwright test cases.

# SRS Description:
# {srs_description}

# Screens:
# {json.dumps(processed_data['screens'], indent=2)}

# Inputs:
# {json.dumps(processed_data['inputs'], indent=2)}

# Buttons:
# {json.dumps(processed_data['buttons'], indent=2)}

# Generate a JSON array of Playwright test cases covering login, product browsing, cart operations, checkout, and account management.
# """

#     payload = {"model": "mistral-nemo-instruct-2407", "prompt": prompt, "max_tokens": 4000, "temperature": 0.7}
    
#     try:
#         response = requests.post(LLM_API_URL, json=payload)
#         response.raise_for_status()
#         result = response.json()
#         test_cases_json = result.get("choices", [{}])[0].get("text", "")
        
#         try:
#             parsed_json = json.loads(test_cases_json)
#             return json.dumps(parsed_json, indent=2)
#         except json.JSONDecodeError:
#             print("Error: Invalid JSON from LLM.")
#             return "[]"
#     except requests.exceptions.RequestException as e:
#         print(f"Error generating test cases with LLM: {e}")
#         return "[]"


# def save_test_cases(test_cases, output_file="test_cases.json"):
#     """Save the generated test cases to a file."""
#     try:
#         with open(output_file, 'w') as file:
#             file.write(test_cases)
#         print(f"Test cases successfully saved to {output_file}")
#     except Exception as e:
#         print(f"Error saving test cases: {e}")


# def main():
#     """Main function to execute the script."""
#     if len(sys.argv) < 2:
#         print("Usage: python script.py <figma_data_file> [srs_summary_file]")
#         sys.exit(1)

#     figma_data_file = sys.argv[1]
#     srs_summary_file = sys.argv[2] if len(sys.argv) > 2 else "../NODE_BACKEND/dataintext/summary.txt"

#     try:
#         with open(srs_summary_file, "r", encoding="utf-8") as file:
#             srs_description = file.read().strip()
#         print(f"SRS Description Loaded from {srs_summary_file}")
#     except Exception as e:
#         print(f"Error reading SRS summary file: {e}")
#         sys.exit(1)

#     print(f"Loading Figma data from {figma_data_file}...")
#     figma_data = load_figma_data(figma_data_file)
#     if not figma_data:
#         print("Failed to load Figma data. Exiting.")
#         return

#     print("Processing Figma data...")
#     processed_data = process_figma_data(figma_data)

#     print("Generating Playwright-compatible test cases using LLM...")
#     test_cases = generate_playwright_test_cases(processed_data, srs_description)

#     print("Saving test cases to test_cases.json...")
#     save_test_cases(test_cases)

#     print("Process completed successfully!")


# if __name__ == "__main__":
#     main()











# import requests
# import json
# import os
# import sys
# from datetime import datetime

# # Fixed URL for LLM API as provided
# LLM_API_URL = "http://10.21.19.17:1234/v1/completions"

# def load_figma_data(json_file_path):
#     """Load Figma data from a JSON file."""
#     try:
#         with open(json_file_path, 'r') as file:
#             return json.load(file)
#     except Exception as e:
#         print(f"Error loading Figma data from file: {e}")
#         return None

# def process_figma_data(data):
#     """Process the Figma data to extract relevant information for test case generation."""
#     processed_data = {
#         "screens": [],
#         "components": [],
#         "inputs": [],
#         "buttons": []
#     }
    
#     # Extract screens (frames)
#     for page in data.get("pages", []):
#         page_name = page.get("page", "")
        
#         for frame in page.get("frames", []):
#             frame_name = frame.get("frame", "")
#             description = frame.get("description", "")
            
#             # Only add frames with meaningful names (not empty or 'Frame')
#             if frame_name and frame_name != "Frame":
#                 screen_info = {
#                     "name": frame_name,
#                     "page": page_name,
#                     "description": description if description != "No text available" else ""
#                 }
#                 processed_data["screens"].append(screen_info)
            
#             # Extract interactive elements
#             for element in frame.get("elements", []):
#                 element_type = element.get("type", "")
#                 element_name = element.get("name", "")
#                 element_category = element.get("category", "")
                
#                 # Specifically identify input fields
#                 if element_category == "Input Field" or "input" in element_name.lower():
#                     processed_data["inputs"].append({
#                         "name": element_name,
#                         "screen": frame_name,
#                         "page": page_name
#                     })
                
#                 # Specifically identify buttons
#                 if element_category == "Button" or element_type == "BUTTON" or "button" in element_name.lower():
#                     processed_data["buttons"].append({
#                         "name": element_name,
#                         "screen": frame_name,
#                         "page": page_name
#                     })
                
#                 # General components
#                 if element_name and element_type:
#                     processed_data["components"].append({
#                         "name": element_name,
#                         "type": element_type,
#                         "category": element_category,
#                         "screen": frame_name,
#                         "page": page_name
#                     })
    
#     return processed_data

# def generate_playwright_test_cases(processed_data, srs_description):
#     """Generate test cases formatted for Playwright using the local LLM."""
#     # Create a prompt for the LLM
#     screens_text = "\n".join([f"- {screen['name']} (in {screen['page']}): {screen['description']}" 
#                              for screen in processed_data["screens"]])
    
#     inputs_text = "\n".join([f"- Input: {inp['name']} on {inp['screen']}" 
#                             for inp in processed_data["inputs"]])
    
#     buttons_text = "\n".join([f"- Button: {btn['name']} on {btn['screen']}" 
#                              for btn in processed_data["buttons"]])
    
#     example_format = """[
#   {
#     "testCase": "Valid Login",
#     "steps": [
#       { "action": "fill", "selector": "#username", "value": "validUser" },
#       { "action": "fill", "selector": "#password", "value": "ValidPass123" },
#       { "action": "click", "selector": "#loginButton" },
#       { "action": "waitForNavigation" }
#     ],
#     "expectedResult": "User is successfully logged in"
#   },
#   {
#     "testCase": "Invalid Password",
#     "steps": [
#       { "action": "fill", "selector": "#username", "value": "validUser" },
#       { "action": "fill", "selector": "#password", "value": "WrongPass" },
#       { "action": "click", "selector": "#loginButton" },
#       { "action": "waitForSelector", "selector": "#errorMessage" }
#     ],
#     "expectedResult": "Error message 'Invalid password' is displayed"
#   }
# ]"""
    
#     prompt = f"""
# You are a QA automation expert tasked with creating Playwright test cases for an e-commerce application based on Figma designs.

# PROJECT INFORMATION:
# 1. SRS Description:
# {srs_description}

# 2. Screens identified in the design:
# {screens_text}

# 3. Input fields identified:
# {inputs_text}

# 4. Buttons identified:
# {buttons_text}

# TASK:
# Generate a comprehensive set of Playwright-compatible test cases for this e-commerce application. 
# The test cases should cover:
# 1. User registration and login flows
# 2. Product browsing and search functionality
# 3. Shopping cart operations (add, remove, update quantity)
# 4. Checkout process
# 5. User account management
# 6. Wishlist functionality

# FORMAT:
# The output must be a valid JSON array of test case objects with the following structure:
# {example_format}

# Available actions include:
# - "navigate": Navigate to a URL
# - "click": Click on an element
# - "fill": Fill an input field
# - "select": Select an option from a dropdown
# - "check": Check a checkbox
# - "uncheck": Uncheck a checkbox
# - "waitForSelector": Wait for an element to appear
# - "waitForNavigation": Wait for navigation to complete
# - "hover": Hover over an element
# - "screenshot": Take a screenshot
# - "pressKey": Press a key on the keyboard
# - "expectText": Verify text is present
# - "expectVisible": Verify element is visible
# - "expectHidden": Verify element is hidden

# For selectors, use appropriate CSS selectors or ID-based selectors that would be reasonable for an e-commerce site.

# IMPORTANT: Generate every possible test cases covering various scenarios. The response must be ONLY the valid JSON array of test cases, without any explanations or comments. Do not include any markdown formatting or code blocks.
# """

#     payload = {
#         "model": "mistral-nemo-instruct-2407",
#         "prompt": prompt,
#         "max_tokens": 4000,
#         "temperature": 0.7
#     }
    
#     try:
#         response = requests.post(LLM_API_URL, json=payload)
#         response.raise_for_status()
#         result = response.json()
#         test_cases_text = result.get("choices", [{}])[0].get("text", "")
        
#         # Clean up the response to ensure it's valid JSON
#         # Find where the JSON array starts and ends
#         start_idx = test_cases_text.find('[')
#         end_idx = test_cases_text.rfind(']') + 1
        
#         if start_idx >= 0 and end_idx > start_idx:
#             test_cases_json = test_cases_text[start_idx:end_idx]
            
#             # Validate JSON format
#             try:
#                 json.loads(test_cases_json)
#                 return test_cases_json
#             except json.JSONDecodeError:
#                 print("LLM returned invalid JSON. Attempting to clean up...")
#                 # Basic cleanup for common issues
#                 cleaned_json = test_cases_json.replace('\n', ' ').replace('\t', ' ')
#                 try:
#                     json.loads(cleaned_json)
#                     return cleaned_json
#                 except json.JSONDecodeError:
#                     print("Failed to parse JSON even after cleanup.")
#                     return test_cases_text
#         else:
#             return test_cases_text
#     except requests.exceptions.RequestException as e:
#         print(f"Error generating test cases with LLM: {e}")
#         return f"Error generating test cases: {str(e)}"

# def save_test_cases(test_cases, output_file="test_cases.json"):
#     """Save the generated test cases to a file."""
#     try:
#         # Check if the test_cases is already JSON string
#         if isinstance(test_cases, str):
#             try:
#                 # Validate JSON by parsing it
#                 json_obj = json.loads(test_cases)
#                 # Write the original string to file
#                 with open(output_file, 'w') as file:
#                     file.write(test_cases)
#             except json.JSONDecodeError:
#                 # If not valid JSON, write as text
#                 with open(output_file, 'w') as file:
#                     file.write(test_cases)
#         else:
#             # If it's an object, dump as JSON
#             with open(output_file, 'w') as file:
#                 json.dump(test_cases, file, indent=2)
        
#         print(f"Test cases successfully saved to {output_file}")
#         return True
#     except Exception as e:
#         print(f"Error saving test cases: {e}")
#         return False
# def main():
#     """Main function to execute the script."""
#     if len(sys.argv) < 2:
#         print("Usage: python paste.py <figma_data_file> [srs_summary_file] [frontend_url]")
#         sys.exit(1)

#     figma_data_file = sys.argv[1]
#     srs_summary_file = sys.argv[2] if len(sys.argv) > 2 else "../NODE_BACKEND/dataintext/summary.txt"
#     frontend_url = sys.argv[3] if len(sys.argv) > 3 else None

#     # Read SRS summary from the provided file path
#     try:
#         with open(srs_summary_file, "r", encoding="utf-8") as file:
#             srs_description = file.read().strip()
#         print(f" SRS Description Loaded from {srs_summary_file}")
#     except Exception as e:
#         print(f" Error reading SRS summary file: {e}")
#         sys.exit(1)  # Exit only if the SRS file is missing

#     # Load and process Figma data
#     print(f" Loading Figma data from {figma_data_file}...")
#     figma_data = load_figma_data(figma_data_file)
#     if not figma_data:
#         print(" Failed to load Figma data. Exiting.")
#         return

#     print(" Processing Figma data...")
#     processed_data = process_figma_data(figma_data)

#     # Generate test cases
#     print(" Generating Playwright-compatible test cases using the local LLM...")
#     test_cases = generate_playwright_test_cases(processed_data, srs_description)

#     # Save test cases
#     output_file = input(" Enter output file path (default: test_cases.json): ") or "test_cases.json"
#     print(f" Saving test cases to {output_file}...")
#     save_test_cases(test_cases, output_file)

#     print(" Process completed successfully!")

# if __name__ == "__main__":
#     main()