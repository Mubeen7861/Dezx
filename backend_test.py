#!/usr/bin/env python3
"""
DEZX Platform Backend API Testing Suite
Tests all API endpoints for authentication, projects, competitions, and admin functionality
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class DEZXAPITester:
    def __init__(self, base_url: str = "https://talent-hub-263.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}  # Store tokens for different user types
        self.users = {}   # Store user data
        self.test_data = {}  # Store created test data
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 user_type: Optional[str] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        # Prepare headers
        test_headers = {'Content-Type': 'application/json'}
        if user_type and user_type in self.tokens:
            test_headers['Authorization'] = f'Bearer {self.tokens[user_type]}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                try:
                    return False, response.json()
                except:
                    return False, {'error': response.text}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        self.log("=== Testing Health Endpoints ===")
        
        # Test root endpoint
        self.run_test("Root Endpoint", "GET", "", 200)
        
        # Test health check
        self.run_test("Health Check", "GET", "health", 200)

    def test_authentication(self):
        """Test authentication endpoints"""
        self.log("=== Testing Authentication ===")
        
        # Test user registration
        test_users = [
            {
                'name': 'Test Designer',
                'email': 'test.designer@dezx.com',
                'password': 'testpass123',
                'role': 'designer'
            },
            {
                'name': 'Test Client',
                'email': 'test.client@dezx.com', 
                'password': 'testpass123',
                'role': 'client'
            }
        ]
        
        for user_data in test_users:
            success, response = self.run_test(
                f"Register {user_data['role']}", 
                "POST", 
                "auth/register", 
                200, 
                user_data
            )
            
            if success and 'token' in response:
                self.tokens[user_data['role']] = response['token']
                self.users[user_data['role']] = response['user']
                self.log(f"✅ Registered and stored token for {user_data['role']}")

        # Test login with existing credentials
        existing_users = [
            {'email': 'admin@dezx.com', 'password': 'admin123', 'role': 'superadmin'},
            {'email': 'sarah@designer.com', 'password': 'password123', 'role': 'designer'},
            {'email': 'client@techstart.com', 'password': 'password123', 'role': 'client'}
        ]
        
        for user_data in existing_users:
            success, response = self.run_test(
                f"Login {user_data['role']}", 
                "POST", 
                "auth/login", 
                200, 
                {'email': user_data['email'], 'password': user_data['password']}
            )
            
            if success and 'token' in response:
                self.tokens[user_data['role']] = response['token']
                self.users[user_data['role']] = response['user']

        # Test /me endpoint
        for user_type in self.tokens:
            self.run_test(f"Get Me ({user_type})", "GET", "auth/me", 200, user_type=user_type)

        # Test invalid login
        self.run_test("Invalid Login", "POST", "auth/login", 401, 
                     {'email': 'invalid@test.com', 'password': 'wrong'})

    def test_projects(self):
        """Test project endpoints"""
        self.log("=== Testing Projects ===")
        
        # Test list projects (public)
        self.run_test("List Projects", "GET", "projects/", 200)
        
        # Test create project (client only)
        if 'client' in self.tokens:
            project_data = {
                'title': 'Test Project',
                'description': 'A test project for API testing',
                'category': 'web-design',
                'budget_min': 500,
                'budget_max': 1000,
                'deadline': (datetime.now() + timedelta(days=30)).isoformat(),
                'skills_required': ['UI/UX', 'Web Design']
            }
            
            success, response = self.run_test(
                "Create Project", "POST", "projects/", 200, 
                project_data, user_type='client'
            )
            
            if success and 'project_id' in response:
                self.test_data['project_id'] = response['project_id']
                
                # Test get specific project
                self.run_test("Get Project", "GET", f"projects/{response['project_id']}", 200)
        
        # Test get my projects (client)
        if 'client' in self.tokens:
            self.run_test("Get My Projects", "GET", "projects/my", 200, user_type='client')

    def test_competitions(self):
        """Test competition endpoints"""
        self.log("=== Testing Competitions ===")
        
        # Test list competitions (public)
        self.run_test("List Competitions", "GET", "competitions/", 200)
        
        # Test create competition (client only)
        if 'client' in self.tokens:
            competition_data = {
                'title': 'Test Design Competition',
                'description': 'A test competition for API testing',
                'brief': 'Design a modern logo',
                'category': 'logo-design',
                'prizes': [
                    {'position': 1, 'amount': 500, 'description': 'First Prize'},
                    {'position': 2, 'amount': 250, 'description': 'Second Prize'}
                ],
                'start_date': datetime.now().isoformat(),
                'end_date': (datetime.now() + timedelta(days=14)).isoformat(),
                'skills_required': ['Logo Design', 'Branding']
            }
            
            success, response = self.run_test(
                "Create Competition", "POST", "competitions/", 200,
                competition_data, user_type='client'
            )
            
            if success and 'competition_id' in response:
                self.test_data['competition_id'] = response['competition_id']
                
                # Test get specific competition
                self.run_test("Get Competition", "GET", f"competitions/{response['competition_id']}", 200)
        
        # Test get my competitions (client)
        if 'client' in self.tokens:
            self.run_test("Get My Competitions", "GET", "competitions/my", 200, user_type='client')

    def test_proposals(self):
        """Test proposal endpoints"""
        self.log("=== Testing Proposals ===")
        
        if 'designer' in self.tokens and 'project_id' in self.test_data:
            # Test create proposal (designer only)
            proposal_data = {
                'project_id': self.test_data['project_id'],
                'cover_letter': 'I am interested in working on this project...',
                'proposed_budget': 750,
                'estimated_duration': '2 weeks'
            }
            
            success, response = self.run_test(
                "Create Proposal", "POST", "proposals/", 200,
                proposal_data, user_type='designer'
            )
            
            if success and 'proposal_id' in response:
                self.test_data['proposal_id'] = response['proposal_id']
            
            # Test get my proposals (designer)
            self.run_test("Get My Proposals", "GET", "proposals/my", 200, user_type='designer')
        
        # Test get project proposals (client)
        if 'client' in self.tokens and 'project_id' in self.test_data:
            self.run_test(
                "Get Project Proposals", "GET", 
                f"proposals/project/{self.test_data['project_id']}", 
                200, user_type='client'
            )

    def test_submissions(self):
        """Test submission endpoints"""
        self.log("=== Testing Submissions ===")
        
        if 'designer' in self.tokens and 'competition_id' in self.test_data:
            # Test create submission (designer only)
            submission_data = {
                'competition_id': self.test_data['competition_id'],
                'title': 'My Competition Entry',
                'description': 'This is my submission for the test competition'
            }
            
            success, response = self.run_test(
                "Create Submission", "POST", "submissions/", 200,
                submission_data, user_type='designer'
            )
            
            if success and 'submission_id' in response:
                self.test_data['submission_id'] = response['submission_id']
            
            # Test get my submissions (designer)
            self.run_test("Get My Submissions", "GET", "submissions/my", 200, user_type='designer')
        
        # Test get competition submissions (public)
        if 'competition_id' in self.test_data:
            self.run_test(
                "Get Competition Submissions", "GET",
                f"submissions/competition/{self.test_data['competition_id']}", 
                200
            )

    def test_notifications(self):
        """Test notification endpoints"""
        self.log("=== Testing Notifications ===")
        
        for user_type in ['designer', 'client']:
            if user_type in self.tokens:
                self.run_test(f"Get Notifications ({user_type})", "GET", "notifications/", 200, user_type=user_type)

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        self.log("=== Testing Admin Endpoints ===")
        
        if 'superadmin' in self.tokens:
            # Test admin stats
            self.run_test("Admin Stats", "GET", "admin/stats", 200, user_type='superadmin')
            
            # Test admin recent activity
            self.run_test("Admin Recent Activity", "GET", "admin/recent-activity", 200, user_type='superadmin')
            
            # Test list users
            self.run_test("List Users", "GET", "users/", 200, user_type='superadmin')
            
            # Test site content
            self.run_test("Get Site Content", "GET", "content/", 200)
        else:
            self.log("⚠️  No superadmin token available for admin tests")

    def test_upload_endpoints(self):
        """Test upload endpoints"""
        self.log("=== Testing Upload Endpoints ===")
        
        if 'designer' in self.tokens:
            # Note: This is a mock test since we don't have actual files
            # In a real scenario, you'd test with actual file uploads
            self.log("ℹ️  Upload endpoints require file data - skipping for now")

    def run_all_tests(self):
        """Run all test suites"""
        self.log("🚀 Starting DEZX API Test Suite")
        self.log(f"Testing against: {self.base_url}")
        
        try:
            self.test_health_check()
            self.test_authentication()
            self.test_projects()
            self.test_competitions()
            self.test_proposals()
            self.test_submissions()
            self.test_notifications()
            self.test_admin_endpoints()
            self.test_upload_endpoints()
            
        except Exception as e:
            self.log(f"Critical error during testing: {str(e)}", "ERROR")
        
        # Print summary
        self.print_summary()
        
        return self.tests_passed == self.tests_run

    def print_summary(self):
        """Print test summary"""
        self.log("=" * 50)
        self.log("📊 TEST SUMMARY")
        self.log("=" * 50)
        self.log(f"Total Tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed}")
        self.log(f"Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                self.log(f"  - {test['name']}")
                if 'expected' in test:
                    self.log(f"    Expected: {test['expected']}, Got: {test['actual']}")
                if 'error' in test:
                    self.log(f"    Error: {test['error']}")
        
        self.log("\n🔑 Available Tokens:")
        for user_type, token in self.tokens.items():
            self.log(f"  {user_type}: {token[:20]}...")
        
        self.log("\n📝 Test Data Created:")
        for key, value in self.test_data.items():
            self.log(f"  {key}: {value}")

def main():
    """Main test runner"""
    tester = DEZXAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())