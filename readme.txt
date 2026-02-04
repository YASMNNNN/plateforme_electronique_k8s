osboxes@osboxes:~/plateforme_electronique/k8s$ kubectl get pods -A
NAMESPACE     NAME                                   READY   STATUS    RESTARTS        AGE
default       api-gateway-664cbdbc6-4gj6n            1/1     Running   0               3h36m
default       eureka-server-676d8467ff-jn258         1/1     Running   0               3h36m
default       frontend-769fdb5859-87rzj              1/1     Running   0               23m
default       invoice-service-8946c587-6tc6n         1/1     Running   13 (35m ago)    3h36m
default       keycloak-5b66659fdf-h48sp              1/1     Running   13 (35m ago)    3h43m
default       notification-service-664fd6c68-wb9fn   1/1     Running   0               3h36m
default       payment-service-85f875b56b-gkdxm       1/1     Running   2 (35m ago)     42m
default       postgresql-758c8445-pdmpp              1/1     Running   1 (3h18m ago)   3h43m
default       redis-7c78fdc98d-6fjw6                 1/1     Running   0               3h43m
default       signature-service-58fc9b4c6-rqb9f      1/1     Running   0               3h36m
default       subscription-service-ffc6dfdc8-tccd6   1/1     Running   3               39m
default       user-auth-service-97855db94-vdr9f      1/1     Running   2 (35m ago)     36m
kube-system   coredns-66bc5c9577-hlk7p               1/1     Running   0               4h23m
kube-system   etcd-minikube                          1/1     Running   0               4h24m
kube-system   kube-apiserver-minikube                1/1     Running   2 (11m ago)     4h24m
kube-system   kube-controller-manager-minikube       1/1     Running   1 (4h24m ago)   4h24m
kube-system   kube-proxy-xlnzn                       1/1     Running   0               4h23m
kube-system   kube-scheduler-minikube                1/1     Running   0               4h24m
kube-system   storage-provisioner                    1/1     Running   19 (10m ago)    4h23m
deployment.apps "api-gateway" deleted
deployment.apps "eureka-server" deleted
deployment.apps "frontend" deleted
deployment.apps "invoice-service" deleted
deployment.apps "keycloak" deleted
deployment.apps "notification-service" deleted
deployment.apps "payment-service" deleted
deployment.apps "postgresql" deleted
deployment.apps "redis" deleted
deployment.apps "signature-service" deleted
deployment.apps "subscription-service" deleted
deployment.apps "user-auth-service" deleted
