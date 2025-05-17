# Run requests in the specified order
bru run "User/User-Create-Inma-Admin.bru" && bru run "User/User-Create-Uni-Admin.bru" && bru run "User/User-Create-Supervisor.bru" && bru run "User/User-Create-Club-Admin.bru" && bru run "User/User-Create-HR-Student.bru" && bru run "User/User-Create-Regular-User.bru"

