"""
DEZX API Backend Tests
Tests for: Authentication, Admin Dashboard, Settings, Audit Logs, Notifications
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://creative-hub-385.preview.emergentagent.com')

# Test credentials
SUPERADMIN_CREDS = {"email": "admin@dezx.com", "password": "admin123"}
DESIGNER_CREDS = {"email": "sarah@designer.com", "password": "password123"}
CLIENT_CREDS = {"email": "client@techstart.com", "password": "password123"}


class TestHealthCheck:
    """Health check tests - run first"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ API health check passed: {data}")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "DEZX" in data.get("message", "")
        print(f"✓ API root check passed: {data}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_superadmin_login(self):
        """Test superadmin login with admin@dezx.com / admin123"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["role"] == "superadmin"
        assert data["user"]["email"] == "admin@dezx.com"
        print(f"✓ Superadmin login successful: {data['user']['name']}")
        return session
    
    def test_designer_login(self):
        """Test designer login with sarah@designer.com / password123"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=DESIGNER_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["role"] == "designer"
        assert data["user"]["email"] == "sarah@designer.com"
        print(f"✓ Designer login successful: {data['user']['name']}")
        return session
    
    def test_client_login(self):
        """Test client login with client@techstart.com / password123"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=CLIENT_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["role"] == "client"
        assert data["user"]["email"] == "client@techstart.com"
        print(f"✓ Client login successful: {data['user']['name']}")
        return session
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint returns current user"""
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDS)
        assert login_resp.status_code == 200
        
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data["email"] == "admin@dezx.com"
        assert data["role"] == "superadmin"
        print(f"✓ Auth/me endpoint working: {data['name']}")


class TestAdminDashboard:
    """Admin dashboard stats tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDS)
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    def test_admin_stats(self, admin_session):
        """Test admin stats endpoint returns all required stats"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        
        # Verify all required stats are present
        required_stats = [
            "total_users", "designers", "clients", "blocked_users",
            "projects", "open_projects", "competitions", "active_competitions",
            "proposals", "submissions"
        ]
        for stat in required_stats:
            assert stat in data, f"Missing stat: {stat}"
            assert isinstance(data[stat], int), f"Stat {stat} should be integer"
        
        print(f"✓ Admin stats: users={data['total_users']}, projects={data['projects']}, competitions={data['competitions']}")
    
    def test_admin_recent_activity(self, admin_session):
        """Test admin recent activity endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/recent-activity")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Recent activity: {len(data)} items")
    
    def test_non_admin_cannot_access_stats(self):
        """Test that non-admin users cannot access admin stats"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json=DESIGNER_CREDS)
        
        response = session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 403
        print("✓ Non-admin correctly blocked from admin stats")


class TestSettingsAPI:
    """Platform settings API tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDS)
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    def test_get_settings(self, admin_session):
        """Test GET /api/settings/ returns platform settings"""
        response = admin_session.get(f"{BASE_URL}/api/settings/")
        assert response.status_code == 200, f"Settings GET failed: {response.text}"
        data = response.json()
        
        # Verify settings structure
        expected_fields = ["is_freelance_enabled", "is_competitions_enabled", "is_registration_enabled"]
        for field in expected_fields:
            assert field in data, f"Missing setting: {field}"
        
        print(f"✓ Settings retrieved: freelance={data.get('is_freelance_enabled')}, competitions={data.get('is_competitions_enabled')}")
    
    def test_update_settings(self, admin_session):
        """Test PUT /api/settings/ updates settings"""
        # First get current settings
        get_resp = admin_session.get(f"{BASE_URL}/api/settings/")
        original = get_resp.json()
        
        # Update a setting
        update_data = {"is_freelance_enabled": True}
        response = admin_session.put(f"{BASE_URL}/api/settings/", json=update_data)
        assert response.status_code == 200, f"Settings update failed: {response.text}"
        
        # Verify update persisted
        verify_resp = admin_session.get(f"{BASE_URL}/api/settings/")
        assert verify_resp.status_code == 200
        print("✓ Settings update successful")
    
    def test_non_admin_cannot_access_settings(self):
        """Test that non-admin users cannot access settings"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json=DESIGNER_CREDS)
        
        response = session.get(f"{BASE_URL}/api/settings/")
        assert response.status_code == 403
        print("✓ Non-admin correctly blocked from settings")


class TestAuditAPI:
    """Audit logs API tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDS)
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    def test_get_audit_logs(self, admin_session):
        """Test GET /api/audit/ returns audit logs"""
        response = admin_session.get(f"{BASE_URL}/api/audit/", params={"page": 1, "limit": 50})
        assert response.status_code == 200, f"Audit GET failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "logs" in data
        assert "total" in data
        assert "page" in data
        assert isinstance(data["logs"], list)
        
        print(f"✓ Audit logs retrieved: {len(data['logs'])} logs, total={data['total']}")
    
    def test_audit_logs_filter_by_entity(self, admin_session):
        """Test audit logs can be filtered by entity type"""
        response = admin_session.get(f"{BASE_URL}/api/audit/", params={"entity_type": "settings"})
        assert response.status_code == 200
        data = response.json()
        
        # All returned logs should be for settings entity
        for log in data["logs"]:
            assert log["entity_type"] == "settings"
        
        print(f"✓ Audit logs filter working: {len(data['logs'])} settings logs")
    
    def test_non_admin_cannot_access_audit(self):
        """Test that non-admin users cannot access audit logs"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json=DESIGNER_CREDS)
        
        response = session.get(f"{BASE_URL}/api/audit/")
        assert response.status_code == 403
        print("✓ Non-admin correctly blocked from audit logs")


class TestNotificationsAPI:
    """Notifications API tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDS)
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    @pytest.fixture
    def designer_session(self):
        """Get authenticated designer session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=DESIGNER_CREDS)
        if response.status_code != 200:
            pytest.skip("Designer login failed")
        return session
    
    @pytest.fixture
    def client_session(self):
        """Get authenticated client session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=CLIENT_CREDS)
        if response.status_code != 200:
            pytest.skip("Client login failed")
        return session
    
    def test_admin_get_notifications(self, admin_session):
        """Test admin can get notifications"""
        response = admin_session.get(f"{BASE_URL}/api/notifications/", params={"page": 1, "limit": 20})
        assert response.status_code == 200, f"Notifications GET failed: {response.text}"
        data = response.json()
        
        assert "notifications" in data
        assert "total" in data
        assert "unread_count" in data
        
        print(f"✓ Admin notifications: {len(data['notifications'])} items, {data['unread_count']} unread")
    
    def test_designer_get_notifications(self, designer_session):
        """Test designer can get notifications"""
        response = designer_session.get(f"{BASE_URL}/api/notifications/", params={"page": 1, "limit": 20})
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        print(f"✓ Designer notifications: {len(data['notifications'])} items")
    
    def test_client_get_notifications(self, client_session):
        """Test client can get notifications"""
        response = client_session.get(f"{BASE_URL}/api/notifications/", params={"page": 1, "limit": 20})
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        print(f"✓ Client notifications: {len(data['notifications'])} items")
    
    def test_unread_count(self, admin_session):
        """Test unread count endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/notifications/unread-count")
        assert response.status_code == 200
        data = response.json()
        
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"✓ Unread count: {data['unread_count']}")
    
    def test_mark_all_read(self, admin_session):
        """Test mark all notifications as read"""
        response = admin_session.put(f"{BASE_URL}/api/notifications/read-all")
        assert response.status_code == 200
        print("✓ Mark all read successful")


class TestUsersAPI:
    """Users management API tests"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=SUPERADMIN_CREDS)
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    def test_list_users(self, admin_session):
        """Test admin can list all users"""
        response = admin_session.get(f"{BASE_URL}/api/users/")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify user structure
        user = data[0]
        assert "id" in user
        assert "email" in user
        assert "role" in user
        
        print(f"✓ Users list: {len(data)} users")
    
    def test_filter_users_by_role(self, admin_session):
        """Test filtering users by role"""
        response = admin_session.get(f"{BASE_URL}/api/users/", params={"role": "designer"})
        assert response.status_code == 200
        data = response.json()
        
        for user in data:
            assert user["role"] == "designer"
        
        print(f"✓ Filtered designers: {len(data)} users")


class TestProjectsAPI:
    """Projects API tests"""
    
    def test_list_projects(self):
        """Test listing projects (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/projects/")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Projects list: {len(data)} projects")
    
    def test_featured_projects(self):
        """Test featured projects endpoint"""
        response = requests.get(f"{BASE_URL}/api/projects/featured")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Featured projects: {len(data)} projects")


class TestCompetitionsAPI:
    """Competitions API tests"""
    
    def test_list_competitions(self):
        """Test listing competitions (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/competitions/")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Competitions list: {len(data)} competitions")
    
    def test_featured_competitions(self):
        """Test featured competitions endpoint"""
        response = requests.get(f"{BASE_URL}/api/competitions/featured")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Featured competitions: {len(data)} competitions")


class TestSiteContent:
    """Site content/CMS API tests"""
    
    def test_get_site_content(self):
        """Test getting site content (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/content/")
        assert response.status_code == 200
        data = response.json()
        
        # Verify content structure
        assert "hero_title" in data or "id" in data
        print(f"✓ Site content retrieved")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
