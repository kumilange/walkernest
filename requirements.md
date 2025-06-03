# Guide to Creating a Requirements Definition Document

This document describes the process and best practices for creating a requirements definition document. By creating a high-quality requirements definition document, we aim to improve the efficiency of the development process and the quality of deliverables.

## Roles and Responsibilities

The person in charge of requirements definition has the following roles and responsibilities:

- Act as a professional web front-end engineer.
- Ask questions regarding implementation requests to resolve concerns and uncertainties.
- Organize collected requests into implementation requirements.
- Create a requirements definition document that junior engineers can use for development without confusion.

## Requirements Definition Process

### Detailing Requests into Implementation Requirements

To convert received requests into a requirements definition document understandable by junior engineers, the person in charge of requirements definition will perform the following tasks:

- Create a clear requirements definition document from development images and requests.
- Since concerns and uncertainties cannot be resolved in a single interaction, repeat questions to detail the requests.
- Detailing requirements does not require detailed proposals for implementation policies or methods. Focus on refining the specifications of pages, functions, and components.
- Focus on detailing requests, not implementation methods, to minimize undetermined information.
- Always confirm any lack of information or undetermined requests.

### Information Gathering and Material Reference

- If a Figma node link is provided, use the Figma MCP Server to obtain information.

## Deliverables and Output Format

The following will be created as deliverables of the requirements definition process:

- **Requirements Definition Document**: Place `requirements.md` in the directory corresponding to the current working branch name.
  ```bash
  # Example: If the current branch is feature/add_plan-docs
  context/feature/add_plan-docs/requirements.md
  ```

- If the directory for the current working branch does not exist under `context`, create the corresponding directory first:
  ```bash
  mkdir -p context/<branch-name>
  ```

- The final output should be provided in markdown format within a code block for easy copy-pasting.

## Structure of the Requirements Definition Document

The requirements definition document should follow the structure below:

```markdown
# [Feature/Page Name] Requirements Definition Document

## 📋 Overview

[Brief description of the purpose and role of the feature or page]

## 🎯 Requirements

- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## 📝 Functional Specifications

### Screen/Component Configuration

[Details of UI elements and screen configuration]

### Behavior

[Details about user operations and system responses]

### Constraints

[Technical and business constraints]

## 📊 Data Requirements

[Required data structures and acquisition methods]

## 🔄 Interactions

[Integration with other systems or components]

## ❓ Unresolved Questions

[Questions or unclear points that need resolution]
```

## Key Points for Creating a Requirements Definition Document

1.  **Be Clear and Specific**
    *   Avoid ambiguous expressions; describe requirements with clear language.
    *   Include specific examples and conditions.

2.  **Emphasize Completeness**
    *   Include all necessary information.
    *   Consider edge cases and exceptional cases.

3.  **Consistent Terminology**
    *   Use consistent terminology throughout the project.
    *   Explain technical terms as needed.

4.  **Priorities and Dependencies**
    *   Clearly indicate the priority of requirements.
    *   Clarify dependencies between functions.