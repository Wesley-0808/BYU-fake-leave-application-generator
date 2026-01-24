import requests
import json
import time
import os

# 加载 Session 配置
def load_session():
    session_path = os.path.join(os.path.dirname(__file__), "session.json")
    try:
        with open(session_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print("错误: 找不到 session.json，请确保该文件存在。")
        return {}

session_info = load_session()

BASE_URL = "https://my.baiyunu.edu.cn"
API_URL = f"{BASE_URL}/api/hrm/common/browser/data/resource"

# 使用 Headers
HEADERS = {
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    "Cookie": session_info.get("Cookie", ""),
    "eteamsid": session_info.get("eteamsid", "")
}

def fetch_users():
    session = requests.Session()
    session.headers.update(HEADERS)

    all_users = []
    page_size = 500
    current_page = 1
    total_users = 0

    # 初始 Payload 数据，基于 HAR 文件中的请求内容
    payload = {
        "browserMultiple": True,
        "cmd": "teams",
        "pageSize": page_size,
        "current": current_page,
        "formDatas": {
            "username": [{"usernameOpt": "in"}],
            "status": [{"statusSelect": ["normal"]}],
            "department": [{"departmentOpt": "in"}],
            "role": [{"roleOpt": "in"}],
            "position": [{"positionOpt": "in"}]
        },
        "quickSearchDatas": {},
        "type": "and",
        "leftTreeSelectedId": "904965908865998848", # 广东白云学院根节点 ID
        "leftAllLevel": True,
        "containsNoneAccount": False,
        "containsPartTimeEmployee": False,
        "leftCompanyId": "1",
        "showTabs": "",
        "formParam": json.dumps({
            "formId": "930467019515330563",
            "layoutId": "931308360491720704",
            "fieldId": "930467290006544385",
            "filterItems": [],
            "module": "ebuildercard",
            "dataDetails": [],
            "templateId": ""
        }),
        "controlId": "930467290006544385",
        "businessId": "930467019515330563",
    }

    print("开始获取人员信息...")

    try:
        while True:
            payload["current"] = current_page
            response = session.post(API_URL, json=payload)
            
            if response.status_code != 200:
                print(f"请求失败，状态码: {response.status_code}")
                break
            
            result = response.json()
            if not result.get("status"):
                print(f"接口返回错误: {result.get('msg')}")
                break
            
            data_list = result.get("data", {}).get("data", [])
            total_users = result.get("data", {}).get("total", 0)
            
            if not data_list:
                break
            
            for item in data_list:
                user_info = {
                    "id": item.get("id"),
                    "cid": item.get("cid"),
                    "userid": item.get("userid"),
                    "position": item.get("position"),
                    "name": item.get("name"),
                    "mobile": item.get("mobile"),
                    "department": item.get("department"),
                    "department_id": item.get("departmentId")
                }
                all_users.append(user_info)
            
            print(f"已获取 {len(all_users)} / {total_users} 人员信息...")
            
            if len(all_users) >= total_users:
                break
                
            current_page += 1
            # 适当等待，防止被封
            time.sleep(0.5)

    except Exception as e:
        print(f"发生错误: {e}")

    # 保存到 json 文件
    export_path = os.path.join(os.path.dirname(__file__), "..", "export", "source_data.json")
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(all_users, f, ensure_ascii=False, indent=2)
    
    print(f"采集完成！总计 {len(all_users)} 人，已保存到 {export_path}")

if __name__ == "__main__":
    fetch_users()
