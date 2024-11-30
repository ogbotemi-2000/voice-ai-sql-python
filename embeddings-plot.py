import matplotlib.pyplot as plt
import numpy as np

# Generate random data for demonstration
np.random.seed(0)
x1 = np.random.rand(50) + 1
y1 = np.random.rand(50) + 1

x2 = np.random.rand(50) + 2
y2 = np.random.rand(50) + 2

x3 = np.random.rand(50) + 3
y3 = np.random.rand(50) + 3

# Plotting the data
plt.scatter(x1, y1, color='r', label='Cluster 1')
plt.scatter(x2, y2, color='g', label='Cluster 2')
plt.scatter(x3, y3, color='b', label='Cluster 3')

plt.xlabel('X-axis')
plt.ylabel('Y-axis')
plt.title('2D Scatter Plot of Word Clusters')
plt.legend()
plt.show()
