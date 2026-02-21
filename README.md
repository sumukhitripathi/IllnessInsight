# IllnessInsight

IllnessInsight is a web application designed to provide personalized health insights based on user-inputted symptoms. It leverages machine learning to assess possible illnesses and offers informative suggestions, making it a valuable tool for users seeking preliminary health information.

## Introduction

IllnessInsight enables users to input health symptoms and receive predictions about potential illnesses. The platform employs a trained machine learning model to analyze symptoms and returns a probable illness outcome. This repository contains all the source code, data, and configuration files needed to set up and run the application both locally and in production environments.

## Features

- For doctors and operations:
  - Smart recommendations to flag unusual values and suggest tests.
  - Diagnostic snapshots that convert history, vitals, and labs into health profiles.
  - Interactive dashboards for appointment flow, prescriptions, test timelines, and alerts.
- For patients and hospital experience:
  - Pre and post surgery support with emotional coaching, FAQs, and early disease detection.
  - Multilingual onboarding with AI driven support in regional dialects.
  - Cultural intelligence layer that adapts UX to local beliefs and family inputs.
  - Nearest hospital facility suggestions for quick emergency services.

## Requirements

- Python 3.7 or higher
- pip (Python package installer)
- Required Python packages (see `requirements.txt`):
  - Flask
  - scikit-learn
  - pandas
  - numpy
  - matplotlib
  - seaborn
  - joblib

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sumukhitripathi/IllnessInsight.git
   cd IllnessInsight
   ```

2. **Create a virtual environment (optional but recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install the dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **(Optional) Train the machine learning model:**

   If you wish to retrain the model, run the training script:

   ```bash
   python train.py
   ```

5. **Start the Flask web application:**

   ```bash
   python app.py
   ```

   The application will be available at `http://127.0.0.1:5000/`.

## Usage

- **Access the Web Interface:**
  - Navigate to `http://127.0.0.1:5000/` in your web browser.
  - Enter symptoms as prompted and submit the form.
  - View the predicted illness and additional health advice.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
