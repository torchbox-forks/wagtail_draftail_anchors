import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="wagtail_draftail_anchors",
    version="0.8.0",
    author="Wagtail Core Team",
    author_email="hello@wagtail.org",
    description="A Draftail extension to add anchor identifiers to rich text",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/wagtail-nest/wagtail_draftail_anchors",
    packages=setuptools.find_packages(),
    include_package_data=True,
    install_requires=[
        # Require Wagtail 7.0 or later
        "wagtail>=7.0",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Framework :: Wagtail :: 7",
    ],
    python_requires=">=3.10",
)
