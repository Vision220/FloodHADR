import urllib.request
import json

BASE_URL = "http://localhost:8000/api"

def test_demo_package():
    print("Testing GET /api/demo/package ...")
    req = urllib.request.Request(f"{BASE_URL}/demo/package")
    with urllib.request.urlopen(req) as response:
        status = response.getcode()
        body = json.loads(response.read().decode('utf-8'))
        print("Status:", status)
        print("Inventory Response:", body)
        assert status == 200
        assert body.get("is_demo_package") is True

    print("\nTesting POST /api/demo/load ...")
    req2 = urllib.request.Request(f"{BASE_URL}/demo/load", method="POST")
    with urllib.request.urlopen(req2) as response2:
        status2 = response2.getcode()
        body2 = json.loads(response2.read().decode('utf-8'))
        print("Status:", status2)
        print("Load Response:", body2)
        assert status2 == 200
        assert body2.get("is_demo_data") is True
        assert "simulation_id" in body2

    print("\nSUCCESS: All Demo Package backend endpoints passed successfully!")

if __name__ == "__main__":
    test_demo_package()
