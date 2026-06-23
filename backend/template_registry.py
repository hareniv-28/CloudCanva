from jinja2 import FileSystemLoader, Environment

class TemplateRegistry:
    _env = None
    _template_map = {
        "aws_aws_instance": "aws/ec2.tf.j2",
        "aws_provider": "aws/provider.tf.j2",
        "aws_aws_eip": "aws/eip/elastic_ip.tf.j2",
        "aws_eip_association": "aws/eip/eip_association.tf.j2",
        "aws_vpc": "aws/vpc.tf.j2",
        "aws_subnet": "aws/subnet.tf.j2",
        "aws_internet_gateway": "aws/internet_gateway.tf.j2",
        "aws_nat_gateway": "aws/nat_gateway.tf.j2",
        "aws_route_table": "aws/routing/route_table.tf.j2",
        "aws_route_table_association": "aws/routing/route_table_association.tf.j2",
        "aws_security_group": "aws/security_group/security_group.tf.j2",
        "aws_vpc_security_group_ingress_rule": "aws/security_group/vpc_security_group_ingress_rule.tf.j2",
        "aws_vpc_security_group_egress_rule": "aws/security_group/vpc_security_group_egress_rule.tf.j2",
        "aws_s3_bucket": "aws/s3/bucket.tf.j2",
        "aws_load_balancer": "aws/load_balancer/load_balancer.tf.j2",
        "aws_target_group": "aws/load_balancer/target_group.tf.j2",
        "aws_rds_instance": "aws/rds.tf.j2",
        "aws_ecs_cluster": "aws/ecs/ecs.tf.j2",
        "aws_eks_cluster": "aws/eks.tf.j2",
    }

    def __init__(self, template_dir='templates'):
        if TemplateRegistry._env is None:
            TemplateRegistry._env = Environment(
                loader=FileSystemLoader(template_dir),
                auto_reload=True,
                trim_blocks=True,
                lstrip_blocks=True
            )

    def get_template(self, name: str):
        if name not in self._template_map:
            raise ValueError(f"Template '{name}' not found in template map.")
        return TemplateRegistry._env.get_template(self._template_map[name])
