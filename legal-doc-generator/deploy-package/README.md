# Hukuk.AI - Legal Document Generator

This package contains the Hukuk.AI Legal Document Generator application, configured for deployment on Hostinger.

## Important Files

- `wsgi.py` - Main WSGI entry point for the application
- `passenger_wsgi.py` - Hostinger compatibility file
- `.htaccess` - Apache configuration for routing
- `requirements.txt` - Python dependencies
- `.env` - Environment variables (must be updated with your values)

## Deployment Steps

1. Upload all files to your Hostinger public_html directory
2. Update the `.env` file with your database credentials and API keys
3. Connect via SSH and set up a Python virtual environment
4. Install requirements: `pip install -r requirements.txt`
5. Initialize the database
6. Set appropriate file permissions

For detailed deployment instructions, refer to the deployment guide.

## Support

If you encounter any issues during deployment, check the logs in `app/logs/app.log` and refer to the troubleshooting section of the deployment guide.

## Copyright

© 2025 Hukuk.AI - All Rights Reserved 