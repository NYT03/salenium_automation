import os
import subprocess
import time
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from webExtractor import scrape_website
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

SCRAPED_SITE_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scraped_site')
os.makedirs(SCRAPED_SITE_FOLDER, exist_ok=True)

def parse_test_logs(output):
    """Parse the test output to extract test case results"""
    test_logs = []
    current_test = None
    
    for line in output.split('\n'):
        if line.strip().startswith('✓') or line.strip().startswith('✗'):
            test_logs.append({
                'test_case': line.strip(),
                'status': 'passed' if '✓' in line else 'failed'
            })
    
    return test_logs

def generate_test_report(test_logs, output, target_url, timestamp):
    """Generate a PDF report of test results"""
    report_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reports')
    os.makedirs(report_folder, exist_ok=True)
    
    filename = f"test_report_{timestamp}.pdf"
    report_path = os.path.join(report_folder, filename)
    
    doc = SimpleDocTemplate(
        report_path,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Create the content
    styles = getSampleStyleSheet()
    elements = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30
    )
    elements.append(Paragraph("Test Execution Report", title_style))
    
    # Website URL
    elements.append(Paragraph(f"Target Website: {target_url}", styles["Heading2"]))
    elements.append(Spacer(1, 12))
    
    # Test Summary
    passed = sum(1 for log in test_logs if log['status'] == 'passed')
    total = len(test_logs)
    
    summary_data = [
        ["Total Tests", str(total)],
        ["Passed", str(passed)],
        ["Failed", str(total - passed)]
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 1*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Detailed Results
    elements.append(Paragraph("Detailed Test Results", styles["Heading2"]))
    elements.append(Spacer(1, 12))
    
    detail_data = [["Test Case", "Status"]]
    for log in test_logs:
        detail_data.append([log['test_case'], log['status'].upper()])
    
    detail_table = Table(detail_data, colWidths=[5*inch, 1*inch])
    detail_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(detail_table)
    
    # Build the PDF
    doc.build(elements)
    return report_path

# Add after CORS setup
# Initialize Node.js environment
def setup_node_environment():
    """Setup Node.js environment with required dependencies"""
    try:
        # Create package.json if it doesn't exist
        if not os.path.exists('package.json'):
            npm_init = subprocess.run(['npm', 'init', '-y'], capture_output=True, text=True)
            if npm_init.returncode != 0:
                print("Error initializing npm:", npm_init.stderr)
                return False

        # Install required dependencies including ChromeDriver
        install_cmd = ['npm', 'install', 'selenium-webdriver', 'mocha', 'chai', 'chromedriver']
        result = subprocess.run(install_cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print("Error installing dependencies:", result.stderr)
            return False
        
        # Add ChromeDriver to PATH
        chromedriver_path = os.path.join(os.getcwd(), 'node_modules', 'chromedriver', 'bin')
        os.environ['PATH'] = f"{chromedriver_path};{os.environ['PATH']}"
        
        return True
    except Exception as e:
        print(f"Setup error: {str(e)}")
        return False

# Initialize Node.js environment when app starts
if not setup_node_environment():
    print("Warning: Failed to setup Node.js environment")

# Modify the upload_file function to ensure dependencies are installed
@app.route('/upload', methods=['POST'])
def upload_file():
    # Enhanced debugging
    print("Request received:")
    print(f"Content Type: {request.content_type}")
    print(f"Files keys: {list(request.files.keys())}")
    print(f"Form keys: {list(request.form.keys())}")

    # Check for file in different possible keys
    file = None
    possible_keys = ['file', 'testFile', 'jsFile', 'script']
    
    for key in possible_keys:
        if key in request.files:
            file = request.files[key]
            print(f"Found file in key: {key}")
            break
    
    if not file:
        return jsonify({
            'error': 'No file found',
            'available_keys': list(request.files.keys()),
            'content_type': request.content_type
        }), 400

    # Validate URL
    if 'url' not in request.form:
        return jsonify({'error': 'URL is required'}), 400
    
    target_url = request.form['url']
    
    # Enhanced file validation
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    allowed_extensions = ['.js', '.mjs', '.cjs']
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        return jsonify({
            'error': f'Invalid file type. Allowed types: {", ".join(allowed_extensions)}',
            'received': file.filename
        }), 400

    try:
        # Ensure Node.js dependencies are installed
        if not os.path.exists('node_modules/selenium-webdriver'):
            if not setup_node_environment():
                return jsonify({'error': 'Failed to install required dependencies'}), 500

        timestamp = int(time.time())
        safe_filename = f"test_{timestamp}_{os.path.basename(file.filename)}"
        file_path = os.path.join(SCRAPED_SITE_FOLDER, safe_filename)
        
        file.save(file_path)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Failed to save file'}), 500
            
        print(f"Successfully saved file to: {file_path}")
        
        # Check if we should use live website or scrape it
        use_live_site = request.form.get('use_live_site', 'true').lower() == 'true'
        
        if not use_live_site:
            print(f"Scraping website: {target_url}")
            scrape_website(target_url, SCRAPED_SITE_FOLDER)
        else:
            print(f"Using live website: {target_url}")
        
        print(f"Running test: {file_path}")
        
        # Set up environment variables for the test
        env_vars = os.environ.copy()
        env_vars.update({
            "SITE_PATH": SCRAPED_SITE_FOLDER,
            "TARGET_URL": target_url,
            "USE_LIVE_SITE": "true" if use_live_site else "false",
            "CHROMEDRIVER_PATH": os.path.join(os.getcwd(), 'node_modules', 'chromedriver', 'bin')
        })
        
        # Run the test with proper error handling
        result = subprocess.run(
            ['npx', 'mocha', file_path], 
            capture_output=True, 
            text=True,
            env=env_vars,
            shell=True  # Add shell=True for Windows compatibility
        )
        
        test_logs = parse_test_logs(result.stdout)
        
        if result.returncode == 0:
            report_path = generate_test_report(test_logs, result.stdout, target_url, timestamp)
            
            return jsonify({
                'message': 'Success',
                'output': result.stdout,
                'test_logs': test_logs,
                'file_path': file_path,
                'report_url': f'/download_report/{os.path.basename(report_path)}',
                'used_live_site': use_live_site
            }), 200
        else:
            return jsonify({
                'error': 'Test execution failed',
                'output': result.stdout,
                'error_details': result.stderr,
                'test_logs': test_logs
            }), 500
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/download_report/<filename>')
def download_report(filename):
    report_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reports')
    return send_file(
        os.path.join(report_folder, filename),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )

# Simple test endpoint
@app.route('/test', methods=['GET'])
def test_cors():
    return jsonify({'message': 'CORS is enabled'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)