# Uploading Hukuk.AI to Hostinger

Follow these step-by-step instructions to deploy your FastAPI application to Hostinger.

## 1. Prepare Your Hostinger Account

1. **Log in to Hostinger Control Panel**
   - Go to: https://hpanel.hostinger.com/
   - Sign in with your credentials

2. **Create a MySQL Database**
   - Navigate to the "Databases" section
   - Click "Create a New Database"
   - Choose a name (e.g., `aihukukk_legal`)
   - Set up a username and strong password
   - Make note of:
     - Database name
     - Username
     - Password
     - Host (usually "localhost")

3. **Check Python Support**
   - Go to "Website" → "Advanced"
   - Verify that Python is enabled
   - Note which Python version is available (should be 3.7+)

## 2. Upload Files to Hostinger

### Using File Manager:

1. **Access File Manager**
   - Go to "Files" → "File Manager"
   - Navigate to the `public_html` folder

2. **Upload Deployment Package**
   - Click "Upload" button 
   - Either:
     - Upload files one by one
     - Create a ZIP of your `deploy-package` folder and upload the ZIP, then extract

### Using FTP (recommended for large files):

1. **Get FTP Credentials**
   - Go to "Files" → "FTP Accounts"
   - Get your FTP hostname, username, and password

2. **Connect with an FTP Client**
   - Use FileZilla or similar FTP client
   - Connect with your FTP credentials
   - Navigate to the `public_html` directory

3. **Upload Files**
   - Upload all contents from the `deploy-package` directory to `public_html`
   - Ensure you maintain the proper directory structure

## 3. Configure Environment Variables

1. **Update .env File**
   - In File Manager, navigate to `public_html`
   - Edit the `.env` file
   - Update with real values:
     ```
     # Environment type
     ENVIRONMENT=production

     # Database Settings - Update with Hostinger MySQL details
     POSTGRES_SERVER=localhost
     POSTGRES_USER=your_hostinger_db_user
     POSTGRES_PASSWORD=your_hostinger_db_password
     POSTGRES_DB=your_hostinger_db_name

     # Database URL for SQLAlchemy
     DATABASE_URL=mysql+pymysql://your_hostinger_db_user:your_hostinger_db_password@localhost/your_hostinger_db_name

     # Google AI API Settings
     GEMINI_API_KEY=your_actual_api_key_here

     # Security Settings
     SECRET_KEY=generate_a_secure_random_key_here
     ```

## 4. Set Up Python Environment

1. **Connect via SSH**
   - Go to "Advanced" → "SSH Access"
   - Get SSH credentials
   - Connect using Terminal or PuTTY

2. **Create Virtual Environment**
   ```bash
   cd ~/public_html
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Test Database Connection**
   ```bash
   python -c "from app.database import engine; from sqlalchemy import text; print(engine.connect().execute(text('SELECT 1')).fetchone())"
   ```

## 5. Set Up Database Tables

1. **Initialize Database**
   ```bash
   cd ~/public_html
   source venv/bin/activate
   python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

## 6. Configure Permissions

1. **Set File Permissions**
   ```bash
   chmod -R 755 ~/public_html
   chmod 644 ~/public_html/.htaccess
   chmod 644 ~/public_html/.env
   chmod -R 777 ~/public_html/app/logs
   chmod -R 777 ~/public_html/app/output
   ```

## 7. Test Your Deployment

1. **Visit Your Website**
   - Open your browser and go to your domain (e.g., https://aihukukk.com)

2. **Check API Endpoints**
   - Test the API: https://aihukukk.com/api/documents/ai-generate

3. **Check Error Logs**
   - If you encounter any issues, check logs:
     - SSH into your server
     - View logs: `cat ~/public_html/app/logs/app.log`

## 8. Troubleshooting

### Common Issues:

1. **500 Internal Server Error**
   - Check permissions on files and directories
   - Verify Python interpreter path in `passenger_wsgi.py`
   - Look for error messages in the logs

2. **Database Connection Issues**
   - Verify database credentials in `.env`
   - Make sure the MySQL database user has proper permissions
   - Ensure that the database exists

3. **Module Not Found Errors**
   - Check that all dependencies are installed:
     ```bash
     source venv/bin/activate
     pip install -r requirements.txt
     ```

4. **Missing Static Files**
   - Ensure all static files were uploaded correctly
   - Check paths in CORS settings and `app.mount` statements 