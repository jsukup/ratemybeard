"""
Serverless-friendly entry point for Vercel deployment
"""

from main import app as flask_app

# Export the Flask app as a serverless function
app = flask_app
