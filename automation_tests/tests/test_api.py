import pytest
import requests

class TestInventoryAPI:
    """
    毕业论文接口自动化测试用例集
    包含：登录验证、基础数据获取、库存数据查询
    """

    def test_login_success(self, api_base_url):
        """测试正常登录接口"""
        payload = {"username": "admin", "password": "admin123"}
        response = requests.post(f"{api_base_url}/login", json=payload)
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["code"] == 200
        assert "token" in res_data["data"]
        print(f"\n登录成功，获取到的用户名为: {res_data['data']['user']['username']}")

    def test_login_failed(self, api_base_url):
        """测试异常登录接口（密码错误）"""
        payload = {"username": "admin", "password": "wrongpassword"}
        response = requests.post(f"{api_base_url}/login", json=payload)
        # 即使逻辑上失败，FastAPI 可能返回 200 但业务 code 是 401，
        # 或者直接返回 401。根据 main.py 逻辑，返回的是 {"code": 401, ...}
        res_data = response.json()
        assert res_data["code"] == 401
        assert "用户名或密码错误" in res_data["message"]

    def test_get_stores(self, api_base_url, auth_header):
        """测试获取门店列表接口"""
        response = requests.get(f"{api_base_url}/stores", headers=auth_header)
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["code"] == 200
        assert isinstance(res_data["data"], list)
        assert len(res_data["data"]) > 0
        assert res_data["data"][0]["name"] == "总部旗舰店"

    def test_get_products(self, api_base_url, auth_header):
        """测试获取商品列表接口"""
        response = requests.get(f"{api_base_url}/products", headers=auth_header)
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["code"] == 200
        assert res_data["data"][0]["name"] == "测试商品"
        assert "barcode" in res_data["data"][0]

    def test_dashboard_stats(self, api_base_url, auth_header):
        """测试仪表盘统计数据接口"""
        response = requests.get(f"{api_base_url}/dashboard/stats", headers=auth_header)
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["code"] == 200
        assert "totalQuantity" in res_data["data"]
        assert res_data["data"]["totalQuantity"] > 0
        print(f"\n当前全渠道库存总量: {res_data['data']['totalQuantity']}")
