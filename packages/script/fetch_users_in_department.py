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
TREE_URL = f"{BASE_URL}/api/hrm/common/browser/leftData/resource"

# 使用 Headers
HEADERS = {
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    "Cookie": session_info.get("Cookie", ""),
    "eteamsid": session_info.get("eteamsid", "")
}

def get_common_payload():
    return {
        "browserMultiple": True,
        "cmd": "teams",
        "pageSize": 100,
        "current": 1,
        "formDatas": {
            "username": [{"usernameOpt": "in"}],
            "status": [{"statusSelect": ["normal"]}],
            "department": [{"departmentOpt": "in"}],
            "role": [{"roleOpt": "in"}],
            "position": [{"positionOpt": "in"}]
        },
        "quickSearchDatas": {},
        "type": "and",
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

def fetch_tree_level(session, node_id=None, node_data=None):
    payload = get_common_payload()
    if node_id:
        payload["id"] = node_id
        payload["type"] = "department"
        if node_data:
            payload["nodeData"] = node_data
            
    try:
        response = session.post(TREE_URL, json=payload)
        if response.status_code == 200:
            result = response.json()
            if result.get("status"):
                data = result.get("data", {})
                # 有些返回在 data 字段，有些在 data.data
                if isinstance(data, dict):
                    return data.get("data", [])
                return data
    except Exception as e:
        print(f"获取节点 {node_id} 失败: {e}")
    return []

def get_all_departments(session):
    print("正在递归获取所有部门...")
    all_depts = []
    
    # 获取根节点
    root_nodes = fetch_tree_level(session)
    
    stack = []
    for node in root_nodes:
        stack.append(node)
        
    while stack:
        curr = stack.pop()
        all_depts.append(curr)
        
        # 如果不是叶子节点，获取子节点
        # 注意：HAR 中显示如果是部门且 leaf=false，则需要进一步获取
        if not curr.get("isLeaf") and not curr.get("leaf"):
            print(f"  正在展开部门: {curr.get('content')} ({curr.get('id')})")
            # 构造 nodeData，参考 HAR
            node_data = {
                "node": curr,
                "id": curr.get("id"),
                "content": curr.get("content")
            }
            children = fetch_tree_level(session, curr.get("id"), node_data)
            for child in children:
                stack.append(child)
            time.sleep(0.1)
            
    return all_depts

def fetch_users_for_dept(session, dept_id):
    users = []
    current_page = 1
    
    while True:
        payload = get_common_payload()
        payload["current"] = current_page
        payload["leftTreeSelectedId"] = dept_id
        # 设置 leftAllLevel 为 False，只获取当前节点的人员（根据用户反馈）
        payload["leftAllLevel"] = False 
        
        try:
            response = session.post(API_URL, json=payload)
            if response.status_code != 200:
                break
            
            result = response.json()
            if not result.get("status"):
                break
            
            data_list = result.get("data", {}).get("data", [])
            total = result.get("data", {}).get("total", 0)
            
            if not data_list:
                break
                
            for item in data_list:
                users.append({
                    "id": item.get("id"),
                    "cid": item.get("cid"),
                    "userid": item.get("userid"),
                    "position": item.get("position"),
                    "name": item.get("name"),
                    "mobile": item.get("mobile"),
                    "department": item.get("department"),
                    "department_id": item.get("departmentId")
                })
            
            if len(users) >= total:
                break
            current_page += 1
            time.sleep(0.1) # 节点内翻页稍微快点
        except Exception:
            break
            
    return users

def fetch_all():
    session = requests.Session()
    session.headers.update(HEADERS)
    
    depts = get_all_departments(session)
    if not depts:
        print("未找到任何部门")
        return
        
    print(f"找到总计 {len(depts)} 个部门/节点，开始获取人员信息...")
    
    all_users_map = {}
    
    for i, dept in enumerate(depts):
        dept_id = dept.get("id")
        dept_name = dept.get("content")
        
        # 只有特定的节点类型才需要获取人员，HAR 中 type 为 department
        if dept.get("type") != "department":
            continue

        print(f"[{i+1}/{len(depts)}] 正在获取部门 {dept_name} 的人员...")
        users = fetch_users_for_dept(session, dept_id)
        for u in users:
            all_users_map[u["id"]] = u
            
        # 适当等待以防封禁
        if (i + 1) % 10 == 0:
            print(f"已收集 {len(all_users_map)} 个不重复的人员信息...")
            time.sleep(0.5)
            
    final_users = list(all_users_map.values())
    
    export_path = os.path.join(os.path.dirname(__file__), "..", "export", "source_data.json")
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(final_users, f, ensure_ascii=False, indent=2)
    
    print(f"采集完成！共去重获取 {len(final_users)} 人，已保存到 {export_path}")

if __name__ == "__main__":
    fetch_all()
