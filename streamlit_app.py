import streamlit as st
import requests
import os
import time
import webbrowser
from pathlib import Path

st.set_page_config(
    page_title="Selenium Test Runner",
    page_icon="🧪",
    layout="wide"
)

st.title("🧪 Automated Test Runner")
st.markdown("---")

# Create two columns for input
col1, col2 = st.columns(2)

with col1:
    st.subheader("Website Details")
    target_url = st.text_input("Enter Website URL", placeholder="https://example.com")

with col2:
    st.subheader("Test Script")
    uploaded_file = st.file_uploader("Upload Test Script (.js)", type=['js'])

if st.button("Run Tests", type="primary", disabled=not (target_url and uploaded_file)):
    with st.spinner("Running tests..."):
        # Prepare the files and data
        files = {'file': uploaded_file}
        data = {'url': target_url}
        
        try:
            # Make request to Flask backend
            response = requests.post(
                'http://localhost:5000/upload',
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                st.success("✅ Tests completed successfully!")
                
                # Display results in tabs
                tab1, tab2, tab3 = st.tabs(["Test Results", "Details", "Download Report"])
                
                with tab1:
                    results = response.json()
                    test_logs = results.get('test_logs', [])
                    
                    # Calculate statistics
                    total_tests = len(test_logs)
                    passed_tests = sum(1 for log in test_logs if log['status'] == 'passed')
                    failed_tests = total_tests - passed_tests
                    
                    # Display metrics
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Total Tests", total_tests)
                    col2.metric("Passed", passed_tests)
                    col3.metric("Failed", failed_tests)
                    
                    # Display detailed results
                    st.markdown("### Detailed Results")
                    for log in test_logs:
                        if log['status'] == 'passed':
                            st.success(log['test_case'])
                        else:
                            st.error(log['test_case'])
                
                with tab2:
                    st.text_area("Raw Output", response.json().get('output', ''), height=300)
                    
                with tab3:
                    report_url = response.json().get('report_url')
                    if report_url:
                        download_url = f"http://localhost:5000{report_url}"
                        st.markdown(f"[Download Test Report (PDF)]({download_url})")
                    
                    st.markdown("### Scraped Site Location")
                    st.code(response.json().get('scraped_site', ''))
                    
            else:
                st.error(f"❌ Error: {response.json().get('error', 'Unknown error occurred')}")
                if 'error_details' in response.json():
                    st.code(response.json()['error_details'])
                    
        except Exception as e:
            st.error(f"❌ Connection Error: {str(e)}")
            st.info("Make sure the Flask backend is running on port 5000")

# Add footer
st.markdown("---")
st.markdown("### How to use:")
st.markdown("""
1. Enter the target website URL
2. Upload your Selenium test script (.js file)
3. Click 'Run Tests' to start the automation
4. View results and download the PDF report
""")