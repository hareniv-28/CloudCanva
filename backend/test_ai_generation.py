"""
Test cases for CloudCanva AI Architecture Generation (/ai/generate endpoint)

Run with: pytest test_ai_generation.py -v
Or without pytest: python test_ai_generation.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# ─────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────

VALID_LABELS = {"EC2", "VPC", "Subnet", "RDS", "S3", "SecurityGroup",
                "InternetGateway", "ElasticIP", "LoadBalancer",
                "TargetGroup", "RouteTable", "ECS", "EKS"}

VALID_RAW_LABELS = {"aws_instance", "vpc", "subnet", "rds_instance",
                    "s3_bucket", "security_group", "internet_gateway",
                    "aws_eip", "load_balancer", "target_group",
                    "route_table", "ecs_cluster", "eks_cluster"}

VALID_TYPES = {"compute", "network", "database", "storage", "container",
               "kubernetes", "elastic", "SecurityGroup", "LoadBalancer",
               "TargetGroup", "InternetGateway", "Subnet", "RouteTable"}


def validate_response_structure(data):
    """Validate the AI response has correct top-level structure."""
    errors = []

    if "summary" not in data:
        errors.append("Missing 'summary' field")
    elif not isinstance(data["summary"], str) or len(data["summary"]) == 0:
        errors.append("'summary' should be a non-empty string")

    if "nodes" not in data:
        errors.append("Missing 'nodes' field")
    elif not isinstance(data["nodes"], list):
        errors.append("'nodes' should be a list")

    if "edges" not in data:
        errors.append("Missing 'edges' field")
    elif not isinstance(data["edges"], list):
        errors.append("'edges' should be a list")

    return errors


def validate_node(node, index):
    """Validate a single node structure."""
    errors = []
    prefix = f"Node[{index}]"

    # Top-level node fields
    if "id" not in node:
        errors.append(f"{prefix}: Missing 'id'")
    if "type" not in node:
        errors.append(f"{prefix}: Missing 'type'")
    elif node["type"] != "service":
        errors.append(f"{prefix}: 'type' should be 'service', got '{node['type']}'")
    if "position" not in node:
        errors.append(f"{prefix}: Missing 'position'")
    else:
        if "x" not in node["position"] or "y" not in node["position"]:
            errors.append(f"{prefix}: 'position' must have 'x' and 'y'")

    # Data fields
    if "data" not in node:
        errors.append(f"{prefix}: Missing 'data'")
        return errors

    data = node["data"]

    if "label" not in data:
        errors.append(f"{prefix}: Missing 'data.label'")
    elif data["label"] not in VALID_LABELS:
        errors.append(f"{prefix}: Invalid label '{data['label']}'")

    if "provider" not in data:
        errors.append(f"{prefix}: Missing 'data.provider'")
    elif data["provider"] != "aws":
        errors.append(f"{prefix}: Provider should be 'aws', got '{data['provider']}'")

    if "rawLabel" not in data:
        errors.append(f"{prefix}: Missing 'data.rawLabel'")
    elif data["rawLabel"] not in VALID_RAW_LABELS:
        errors.append(f"{prefix}: Invalid rawLabel '{data['rawLabel']}'")

    if "serviceName" not in data:
        errors.append(f"{prefix}: Missing 'data.serviceName'")

    if "properties" not in data:
        errors.append(f"{prefix}: Missing 'data.properties'")

    return errors


def validate_edge(edge, index, node_ids):
    """Validate a single edge structure."""
    errors = []
    prefix = f"Edge[{index}]"

    if "id" not in edge:
        errors.append(f"{prefix}: Missing 'id'")
    if "source" not in edge:
        errors.append(f"{prefix}: Missing 'source'")
    elif edge["source"] not in node_ids:
        errors.append(f"{prefix}: source '{edge['source']}' not found in nodes")
    if "target" not in edge:
        errors.append(f"{prefix}: Missing 'target'")
    elif edge["target"] not in node_ids:
        errors.append(f"{prefix}: target '{edge['target']}' not found in nodes")

    return errors


def validate_properties_for_label(node):
    """Validate that properties contain expected fields based on label."""
    errors = []
    label = node.get("data", {}).get("label", "")
    props = node.get("data", {}).get("properties", {})
    name = node.get("data", {}).get("serviceName", label)

    if label == "VPC":
        if not props.get("cidr_block"):
            errors.append(f"{name} (VPC): Missing 'cidr_block' in properties")

    elif label == "Subnet":
        if not props.get("cidr_block"):
            errors.append(f"{name} (Subnet): Missing 'cidr_block' in properties")

    elif label == "EC2":
        if not props.get("ami"):
            errors.append(f"{name} (EC2): Missing 'ami' in properties")
        if not props.get("instance_type"):
            errors.append(f"{name} (EC2): Missing 'instance_type' in properties")

    elif label == "RDS":
        if not props.get("engine"):
            errors.append(f"{name} (RDS): Missing 'engine' in properties")

    return errors


def run_full_validation(data):
    """Run all validations on a response."""
    all_errors = []

    # Structure validation
    all_errors.extend(validate_response_structure(data))
    if all_errors:
        return all_errors

    # Node validation
    node_ids = set()
    for i, node in enumerate(data["nodes"]):
        all_errors.extend(validate_node(node, i))
        if "id" in node:
            node_ids.add(node["id"])

    # Edge validation
    for i, edge in enumerate(data["edges"]):
        all_errors.extend(validate_edge(edge, i, node_ids))

    # Property validation
    for node in data["nodes"]:
        all_errors.extend(validate_properties_for_label(node))

    return all_errors


# ─────────────────────────────────────────────────────────────
# TEST CASES
# ─────────────────────────────────────────────────────────────

def test_empty_prompt():
    """TC-01: Empty prompt should return 400 error."""
    print("\n[TC-01] Empty prompt...")
    resp = requests.post(f"{BASE_URL}/ai/generate", json={"prompt": ""})
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    print("  ✅ Correctly returned 400 for empty prompt")


def test_missing_prompt_field():
    """TC-02: Missing prompt field should return 400 error."""
    print("\n[TC-02] Missing prompt field...")
    resp = requests.post(f"{BASE_URL}/ai/generate", json={})
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    print("  ✅ Correctly returned 400 for missing prompt")


def test_ecommerce_architecture():
    """TC-03: Ecommerce prompt should return multi-tier architecture."""
    print("\n[TC-03] Ecommerce architecture...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Build a scalable ecommerce application with database"})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    data = resp.json()
    errors = run_full_validation(data)
    if errors:
        for e in errors:
            print(f"  ❌ {e}")
        assert False, f"Validation failed with {len(errors)} error(s)"

    # Should have multiple nodes
    assert len(data["nodes"]) >= 3, f"Expected at least 3 nodes, got {len(data['nodes'])}"

    # Should include VPC and compute
    labels = [n["data"]["label"] for n in data["nodes"]]
    assert "VPC" in labels, "Ecommerce arch should include VPC"
    assert "EC2" in labels or "ECS" in labels, "Should include compute (EC2/ECS)"

    # Should have edges (connections)
    assert len(data["edges"]) >= 1, "Should have at least 1 edge"

    print(f"  ✅ Generated {len(data['nodes'])} nodes, {len(data['edges'])} edges")
    print(f"  ✅ Services: {labels}")
    print(f"  ✅ Summary: {data['summary']}")


def test_vpc_network_architecture():
    """TC-04: VPC/network prompt should return networking resources."""
    print("\n[TC-04] VPC network architecture...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Create a VPC with public and private subnets"})
    assert resp.status_code == 200

    data = resp.json()
    errors = run_full_validation(data)
    if errors:
        for e in errors:
            print(f"  ❌ {e}")
        assert False, f"Validation failed with {len(errors)} error(s)"

    labels = [n["data"]["label"] for n in data["nodes"]]
    assert "VPC" in labels, "Network arch should include VPC"
    assert "Subnet" in labels, "Should include Subnet"

    # Check VPC has cidr_block
    vpc_nodes = [n for n in data["nodes"] if n["data"]["label"] == "VPC"]
    for vpc in vpc_nodes:
        assert vpc["data"]["properties"].get("cidr_block"), "VPC must have cidr_block"

    print(f"  ✅ Generated {len(data['nodes'])} nodes: {labels}")


def test_simple_ec2_architecture():
    """TC-05: Simple EC2 prompt should return basic setup."""
    print("\n[TC-05] Simple EC2 setup...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Deploy a single EC2 instance for a small API server"})
    assert resp.status_code == 200

    data = resp.json()
    errors = run_full_validation(data)
    if errors:
        for e in errors:
            print(f"  ❌ {e}")
        assert False, f"Validation failed with {len(errors)} error(s)"

    labels = [n["data"]["label"] for n in data["nodes"]]
    assert "EC2" in labels, "Should include EC2"

    # Check EC2 has ami and instance_type
    ec2_nodes = [n for n in data["nodes"] if n["data"]["label"] == "EC2"]
    for ec2 in ec2_nodes:
        props = ec2["data"]["properties"]
        assert props.get("ami"), "EC2 must have ami"
        assert props.get("instance_type"), "EC2 must have instance_type"

    print(f"  ✅ Generated {len(data['nodes'])} nodes: {labels}")


def test_three_tier_web_app():
    """TC-06: Three-tier web app prompt."""
    print("\n[TC-06] Three-tier web app...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Create a three-tier web application with load balancer and RDS"})
    assert resp.status_code == 200

    data = resp.json()
    errors = run_full_validation(data)
    if errors:
        for e in errors:
            print(f"  ❌ {e}")
        assert False, f"Validation failed with {len(errors)} error(s)"

    labels = [n["data"]["label"] for n in data["nodes"]]
    assert "VPC" in labels, "Three-tier should include VPC"
    has_compute = "EC2" in labels or "ECS" in labels
    has_db = "RDS" in labels
    assert has_compute, "Three-tier should include compute"
    assert has_db, "Three-tier should include database"

    print(f"  ✅ Services: {labels}")


def test_node_ids_are_unique():
    """TC-07: All node IDs should be unique."""
    print("\n[TC-07] Unique node IDs...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Build a web app with VPC, subnets, EC2, and RDS"})
    assert resp.status_code == 200

    data = resp.json()
    node_ids = [n["id"] for n in data["nodes"]]
    assert len(node_ids) == len(set(node_ids)), f"Duplicate node IDs found: {node_ids}"

    edge_ids = [e["id"] for e in data["edges"]]
    assert len(edge_ids) == len(set(edge_ids)), f"Duplicate edge IDs found: {edge_ids}"

    print(f"  ✅ All {len(node_ids)} node IDs unique, all {len(edge_ids)} edge IDs unique")


def test_node_positions_are_valid():
    """TC-08: Node positions should have positive x,y coordinates."""
    print("\n[TC-08] Valid node positions...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Set up a VPC with internet gateway and EC2"})
    assert resp.status_code == 200

    data = resp.json()
    for node in data["nodes"]:
        pos = node["position"]
        assert isinstance(pos["x"], (int, float)), f"Node {node['id']}: x should be number"
        assert isinstance(pos["y"], (int, float)), f"Node {node['id']}: y should be number"
        assert pos["x"] >= 0, f"Node {node['id']}: x should be >= 0"
        assert pos["y"] >= 0, f"Node {node['id']}: y should be >= 0"

    print(f"  ✅ All {len(data['nodes'])} nodes have valid positions")


def test_edges_reference_existing_nodes():
    """TC-09: All edges should reference existing node IDs."""
    print("\n[TC-09] Edge references validity...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Build ecommerce app with load balancer, EC2, and database"})
    assert resp.status_code == 200

    data = resp.json()
    node_ids = {n["id"] for n in data["nodes"]}

    for edge in data["edges"]:
        assert edge["source"] in node_ids, f"Edge source '{edge['source']}' not in nodes"
        assert edge["target"] in node_ids, f"Edge target '{edge['target']}' not in nodes"

    print(f"  ✅ All {len(data['edges'])} edges reference valid nodes")


def test_subnet_has_vpc_ref():
    """TC-10: Subnets should reference a VPC in their properties."""
    print("\n[TC-10] Subnet-VPC references...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Create VPC with two subnets"})
    assert resp.status_code == 200

    data = resp.json()
    subnet_nodes = [n for n in data["nodes"] if n["data"]["label"] == "Subnet"]
    vpc_ids = [n["id"] for n in data["nodes"] if n["data"]["label"] == "VPC"]

    for subnet in subnet_nodes:
        refs = subnet["data"]["properties"].get("refs", {})
        vpc_ref = refs.get("vpc", "")
        assert vpc_ref in vpc_ids, f"Subnet '{subnet['data']['serviceName']}' vpc ref '{vpc_ref}' not in VPCs: {vpc_ids}"

    print(f"  ✅ All {len(subnet_nodes)} subnets correctly reference a VPC")


def test_response_time():
    """TC-11: Response should come within 30 seconds."""
    import time
    print("\n[TC-11] Response time...")
    start = time.time()
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Simple VPC with EC2"}, timeout=30)
    elapsed = time.time() - start
    assert resp.status_code == 200, f"Failed with status {resp.status_code}"
    print(f"  ✅ Response received in {elapsed:.2f}s")


def test_provider_always_aws():
    """TC-12: All nodes should have provider = 'aws'."""
    print("\n[TC-12] Provider check...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Deploy a web server with security group"})
    assert resp.status_code == 200

    data = resp.json()
    for node in data["nodes"]:
        assert node["data"]["provider"] == "aws", \
            f"Node {node['id']} has provider '{node['data']['provider']}', expected 'aws'"

    print(f"  ✅ All {len(data['nodes'])} nodes have provider='aws'")


def test_complex_prompt():
    """TC-13: Complex multi-service prompt."""
    print("\n[TC-13] Complex architecture...")
    prompt = ("Build a production-ready web application with: "
              "VPC with public and private subnets, "
              "internet gateway, load balancer in public subnet, "
              "EC2 instances in private subnet, "
              "RDS database, and security groups")
    resp = requests.post(f"{BASE_URL}/ai/generate", json={"prompt": prompt})
    assert resp.status_code == 200

    data = resp.json()
    errors = run_full_validation(data)
    if errors:
        for e in errors:
            print(f"  ❌ {e}")

    labels = [n["data"]["label"] for n in data["nodes"]]
    print(f"  ✅ Generated {len(data['nodes'])} nodes: {labels}")
    print(f"  ✅ Edges: {len(data['edges'])}")
    print(f"  ✅ Summary: {data['summary']}")


def test_gibberish_prompt():
    """TC-14: Gibberish input should still return valid structure (fallback)."""
    print("\n[TC-14] Gibberish prompt fallback...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "asdfghjkl zxcvbnm qwerty 12345"})
    assert resp.status_code == 200

    data = resp.json()
    # Should at least have valid structure
    struct_errors = validate_response_structure(data)
    assert not struct_errors, f"Structure errors: {struct_errors}"
    assert len(data["nodes"]) >= 1, "Should generate at least 1 node even for gibberish"

    print(f"  ✅ Fallback handled gracefully, {len(data['nodes'])} nodes returned")


def test_s3_storage_prompt():
    """TC-15: Storage-focused prompt should include S3."""
    print("\n[TC-15] S3 storage architecture...")
    resp = requests.post(f"{BASE_URL}/ai/generate",
                         json={"prompt": "Create an S3 bucket for static website hosting"})
    assert resp.status_code == 200

    data = resp.json()
    errors = run_full_validation(data)
    labels = [n["data"]["label"] for n in data["nodes"]]
    assert "S3" in labels, f"Storage prompt should include S3, got: {labels}"

    print(f"  ✅ Generated: {labels}")


# ─────────────────────────────────────────────────────────────
# RUN ALL TESTS
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    tests = [
        test_empty_prompt,
        test_missing_prompt_field,
        test_ecommerce_architecture,
        test_vpc_network_architecture,
        test_simple_ec2_architecture,
        test_three_tier_web_app,
        test_node_ids_are_unique,
        test_node_positions_are_valid,
        test_edges_reference_existing_nodes,
        test_subnet_has_vpc_ref,
        test_response_time,
        test_provider_always_aws,
        test_complex_prompt,
        test_gibberish_prompt,
        test_s3_storage_prompt,
    ]

    passed = 0
    failed = 0
    errors_list = []

    print("=" * 60)
    print("  CloudCanva AI Generation Test Suite")
    print("  Endpoint: POST /ai/generate")
    print("=" * 60)

    for test_fn in tests:
        try:
            test_fn()
            passed += 1
        except AssertionError as e:
            failed += 1
            errors_list.append((test_fn.__name__, str(e)))
            print(f"  ❌ FAILED: {e}")
        except requests.exceptions.ConnectionError:
            failed += 1
            errors_list.append((test_fn.__name__, "Connection refused - is backend running?"))
            print("  ❌ Connection refused - is backend running on localhost:8000?")
            break
        except Exception as e:
            failed += 1
            errors_list.append((test_fn.__name__, str(e)))
            print(f"  ❌ ERROR: {e}")

    print("\n" + "=" * 60)
    print(f"  RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
    print("=" * 60)

    if errors_list:
        print("\n  Failed tests:")
        for name, err in errors_list:
            print(f"    - {name}: {err}")
