import subprocess
import sys
import os

def check_python_version():
    """Check if Python version is compatible"""
    required_version = (3, 9)
    current_version = sys.version_info[:2]
    
    if current_version < required_version:
        print(f"Error: Python {required_version[0]}.{required_version[1]} or higher is required")
        sys.exit(1)

def install_python_dependencies():
    """Install required Python packages"""
    requirements = [
        'flask',
        'flask-cors',
        'requests',
        'streamlit',
        'reportlab',
        'selenium',
        'beautifulsoup4'
    ]
    
    print("Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], check=True)
        subprocess.run([sys.executable, '-m', 'pip', 'install'] + requirements, check=True)
        print("✅ Python dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing Python dependencies: {e}")
        sys.exit(1)

def check_node():
    """Check if Node.js and npm are installed and in PATH, install if not found"""
    try:
        # Check Node.js version with explicit path
        node_paths = [
            os.path.join(os.environ.get('ProgramFiles'), 'nodejs', 'node.exe'),
            os.path.join(os.environ.get('ProgramFiles(x86)'), 'nodejs', 'node.exe'),
            os.path.join(os.environ.get('LOCALAPPDATA'), 'Programs', 'nodejs', 'node.exe'),
            'node'  # Try from PATH
        ]
        
        node_cmd = None
        for path in node_paths:
            try:
                # Check if path exists before running
                if os.path.exists(path) or path == 'node':
                    result = subprocess.run([path, '--version'], 
                                          capture_output=True, 
                                          text=True, 
                                          shell=True)
                    if result.returncode == 0:
                        node_cmd = path
                        print(f"✅ Found Node.js at: {path}")
                        break
            except Exception as e:
                print(f"⚠️ Path check failed for {path}: {str(e)}")
                continue
        
        if not node_cmd:
            print("❌ Node.js not found, downloading and installing...")
            try:
                # Download Node.js installer
                node_installer_url = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi"
                installer_path = os.path.join(os.environ['TEMP'], 'nodejs_installer.msi')
                
                # Download the installer
                import urllib.request
                urllib.request.urlretrieve(node_installer_url, installer_path)
                
                # Run the installer silently
                subprocess.run(['msiexec', '/i', installer_path, '/quiet', '/norestart'], check=True)
                
                # Add Node.js to PATH
                node_path = os.path.join(os.environ.get('ProgramFiles'), 'nodejs')
                os.environ['PATH'] += f";{node_path}"
                
                # Verify installation
                result = subprocess.run(['node', '--version'], capture_output=True, text=True, shell=True)
                if result.returncode == 0:
                    print("✅ Node.js installed successfully")
                    node_cmd = 'node'
                else:
                    raise Exception("Node.js installation failed")
                    
            except Exception as e:
                print(f"❌ Failed to install Node.js: {str(e)}")
                print("Please install Node.js manually from https://nodejs.org/")
                return False
                
        print(f"✅ Node.js version: {result.stdout.strip()}")
        print(f"🔍 Node.js Path: {node_cmd}")

        # Check npm version
        npm_version = subprocess.run(['npm', '--version'], 
                                   capture_output=True, 
                                   text=True, 
                                   shell=True)
        if npm_version.returncode != 0:
            print("❌ npm is not installed or not found in PATH")
            return False
        print(f"✅ npm version: {npm_version.stdout.strip()}")

        return True

    except Exception as e:
        print(f"⚠️ Error checking Node.js: {str(e)}")
        print("Common installation paths checked:")
        for path in node_paths:
            print(f" - {path}")
        return False

def install_node_dependencies():
    """Install required Node.js packages"""
    packages = [
        'selenium-webdriver',
        'mocha',
        'chai',
        'chromedriver'
    ]
    
    print("Installing Node.js dependencies...")
    try:
        # Initialize package.json if it doesn't exist
        if not os.path.exists('package.json'):
            subprocess.run(['npm', 'init', '-y'], check=True)
        
        # Get the Node.js path from common installation locations
        node_path = None
        for path in [
            os.path.join(os.environ.get('ProgramFiles', ''), 'nodejs'),
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Programs', 'nodejs')
        ]:
            if os.path.exists(path):
                node_path = path
                break
        
        # Update PATH for the current process
        if node_path:
            os.environ['PATH'] = f"{node_path};{os.environ['PATH']}"
        
        # Install dependencies using the full path to npm
        npm_path = os.path.join(node_path, 'npm.cmd') if node_path else 'npm'
        subprocess.run([npm_path, 'install'] + packages + ['--save-dev'], check=True)
        
        # Install ChromeDriver globally
        subprocess.run([npm_path, 'install', '-g', 'chromedriver'], check=True)
        
        print("✅ Node.js dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing Node.js dependencies: {e}")
        sys.exit(1)

def create_directories():
    """Create necessary directories"""
    directories = ['reports', 'scraped_site']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    print("✅ Project directories created")

def main():
    print("Setting up Test Runner environment...")

    # Check Python version
    check_python_version()

    # Check Node.js installation
    if not check_node():
        print("❌ Node.js and npm are required but not found.")
        print("Please install Node.js from https://nodejs.org/")
        sys.exit(1)

    # Create project directories
    create_directories()

    # Install dependencies
    install_python_dependencies()
    install_node_dependencies()

    print("\n✨ Setup completed successfully!")
    print("\nTo start the application:")
    print("1. Start the Flask backend:")
    print("   python sel_runner.py")
    print("2. In a new terminal, start the Streamlit frontend:")
    print("   streamlit run streamlit_app.py")

if __name__ == "__main__":
    main()
