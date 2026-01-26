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

def fetch_tree_level(session, node=None):
    payload = get_common_payload()
    if node:
        payload["id"] = node.get("id")
        payload["type"] = "department"
        payload["nodeData"] = {
            "node": node,
            "id": node.get("id"),
            "content": node.get("content")
        }
            
    try:
        response = session.post(TREE_URL, json=payload)
        if response.status_code == 200:
            result = response.json()
            if result.get("status"):
                data = result.get("data", {})
                if isinstance(data, dict):
                    return data.get("data", [])
                return data
        else:
            print(f"请求失败，状态码: {response.status_code}")
    except Exception as e:
        print(f"获取子节点失败: {e}")
    return []

def build_recursive_tree(session, node):
    """
    递归构建树形结构
    """
    # 转换为要求的字段格式
    tree_node = {
        "id": node.get("id"),
        "department": node.get("content"),
        "children": []
    }
    
    # 如果不是叶子节点，则继续采集子节点
    if not node.get("isLeaf") and not node.get("leaf"):
        print(f"  正在获取 {node.get('content')} 的下级部门...")
        time.sleep(0.1) # 避免请求过快
        children_data = fetch_tree_level(session, node)
        
        for child in children_data:
            # 只有 type 为 department 的节点才是我们需要的人员组织架构
            if child.get("type") == "department":
                tree_node["children"].append(build_recursive_tree(session, child))
                
    return tree_node

def main():
    session = requests.Session()
    session.headers.update(HEADERS)
    
    print("开始构建部门树...")
    
    # 获取根节点
    root_nodes_data = fetch_tree_level(session)
    
    final_tree = []
    for root_node in root_nodes_data:
        if root_node.get("type") == "department":
            final_tree.append(build_recursive_tree(session, root_node))
            
    # 保存为 department.json
    import os
    export_path = os.path.join(os.path.dirname(__file__), "..", "export", "department.json")
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(final_tree, f, ensure_ascii=False, indent=2)
        
    print(f"部门树采集完成！已保存到 {export_path}")

if __name__ == "__main__":
    main()
