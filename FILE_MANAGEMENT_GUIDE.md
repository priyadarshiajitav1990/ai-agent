# File Management Guide

## Overview

The AI Assistant now includes full file system management capabilities, allowing you to create, read, update, delete, and organize files and directories directly from the chat interface. The agent has the same permissions as the current logged-in user.

## Features

✅ **File Operations**
- Create files with content
- Read file contents
- Update/modify existing files
- Delete files
- Append to files

✅ **Directory Operations**
- Create directories (with recursive parent creation)
- Delete directories (empty or recursive)
- List directory contents
- Get directory information

✅ **File Management**
- Copy files and directories
- Move/rename files and directories
- Get file/directory information
- Change working directory
- Print working directory

✅ **Natural Language Support**
- Parse natural language commands
- Support multiple command syntaxes
- Intelligent path handling (~, relative, absolute paths)

## Quick Start

### Enable File Commands

During your chat session, simply give file management commands in natural language. File commands are automatically detected and processed.

### View Available Commands

```
/files
```

This displays all available file management commands with examples.

## File Command Reference

### Creating Files

Create a new file with content:

```
create file /path/to/file.txt with Hello World
write /path/to/file.txt containing content here
```

**Examples:**
```
create file ~/my_project/README.md with # My Project
write ~/notes.txt containing Important information
```

**Features:**
- Automatically creates parent directories
- Prevents overwriting existing files
- Supports UTF-8 encoding (default)

### Reading Files

View file contents:

```
read file /path/to/file.txt
show /path/to/file.txt
cat /path/to/file.txt
```

**Examples:**
```
read file ~/projects/config.json
show /etc/hostname
```

**Output:**
- File content displayed
- Full file path shown
- File size and location included

### Updating Files

Modify existing file content:

```
update file /path/to/file.txt with new content
modify /path/to/file.txt to new content
```

**Examples:**
```
update file ~/config.txt with updated settings
modify ~/script.sh to #!/bin/bash
```

**Options:**
- Replace entire content (default)
- Append to end (use `append` keyword)

### Appending to Files

Add content to the end of a file:

```
append to /path/to/file.txt with additional content
```

**Examples:**
```
append to ~/log.txt with new log entry
```

### Deleting Files

Remove files permanently:

```
delete file /path/to/file.txt
remove file /path/to/file.txt
rm /path/to/file.txt
```

**Examples:**
```
delete file ~/temp_file.txt
remove /path/to/old_config.json
```

**⚠️ Warning:** This operation is permanent and cannot be undone.

## Directory Commands

### Creating Directories

Create new folders:

```
create directory /path/to/new/folder
mkdir /path/to/new/folder
```

**Examples:**
```
create directory ~/projects/new_project
mkdir ~/data/archives
```

**Features:**
- Creates all parent directories automatically
- No error if directory exists
- Full recursive path support

### Listing Directory Contents

View directory contents:

```
list /path/to/directory
ls /path/to/directory
```

**Examples:**
```
list ~/projects
ls /home/user/documents
list .
```

**Output Format:**
```
✅ Success: Directory contents retrieved: /path/to/directory

📦 Result: {
  "path": "/path/to/directory",
  "contents": [
    {
      "name": "file.txt",
      "path": "/path/to/directory/file.txt",
      "isDirectory": false,
      "isFile": true,
      "size": 1024,
      "modified": "2024-01-27T10:30:00.000Z"
    },
    {
      "name": "subfolder",
      "path": "/path/to/directory/subfolder",
      "isDirectory": true,
      "isFile": false,
      "size": 4096,
      "modified": "2024-01-27T09:15:00.000Z"
    }
  ]
}
```

### Deleting Directories

Remove directories:

```
delete directory /path/to/folder
remove directory /path/to/folder
rmdir /path/to/folder
delete directory /path/to/folder recursive
```

**Examples:**
```
delete directory ~/old_project
rmdir ~/temp recursive
```

**Options:**
- **Empty directory (default)**: Deletes only if directory is empty
- **Recursive**: Delete directory and all contents - use `recursive` keyword or `-r` flag

**⚠️ Warning:** Recursive deletion cannot be undone. Use with caution.

## File Management Operations

### Copying Files and Directories

```
copy /source/file.txt to /dest/file.txt
copy /source/folder to /dest/folder recursive
```

**Examples:**
```
copy ~/documents/report.pdf to ~/backup/report.pdf
copy ~/project to ~/project_backup recursive
```

**Features:**
- Preserves file permissions and metadata
- Creates destination parent directories
- Supports recursive copying for directories

### Moving Files

```
move /source/file.txt to /dest/file.txt
mv /source/file to /dest/file
```

**Examples:**
```
move ~/old_location/file.txt to ~/new_location/file.txt
mv ~/downloads/document.pdf to ~/documents/
```

**Features:**
- Moves to new location
- Renames in one operation
- Creates destination directories if needed

### Renaming Files

```
rename /path/to/file.txt as newname.txt
```

**Examples:**
```
rename ~/config.json as config.backup.json
rename ~/notes.txt as notes_final.txt
```

### Getting File Information

```
info /path/to/file.txt
stat /path/to/file
```

**Examples:**
```
info ~/documents/report.pdf
stat ~/images/photo.jpg
```

**Output Includes:**
- File path and name
- Type (file/directory)
- Size in bytes
- Creation date
- Last modified date
- Last accessed date
- File permissions

## Navigation Commands

### Print Working Directory

Show current directory:

```
pwd
```

**Output:**
```
✅ Success: Current directory: /home/user/projects
```

### Change Directory

Switch to a different directory:

```
cd /path/to/directory
change directory to /path/to/new/location
```

**Examples:**
```
cd ~/projects
cd /
cd /home/user/documents
```

**Path Expansion:**
- `~` - Expands to home directory
- `.` - Current directory
- `..` - Parent directory
- Absolute paths - Full filesystem paths

## Advanced Usage

### Path Expansion

The file system supports multiple path formats:

```
# Home directory
~/projects/myfile.txt

# Absolute paths
/home/user/projects/myfile.txt

# Relative paths (from current directory)
./myfile.txt
projects/myfile.txt

# Special directories
../parent_dir/file.txt
../../grandparent/file.txt
```

### Batch Operations

You can chain multiple file operations:

```
1. create directory ~/my_project
2. create file ~/my_project/README.md with # Project Title
3. list ~/my_project
```

### Working with Configuration Files

Create and manage JSON configs:

```
create file ~/config.json with {"name": "app", "version": "1.0.0"}
read file ~/config.json
update file ~/config.json with {"name": "app", "version": "2.0.0"}
```

### Log File Management

```
create file ~/logs/app.log with [INFO] Application started
append to ~/logs/app.log with [INFO] User logged in
append to ~/logs/app.log with [ERROR] Connection failed
read file ~/logs/app.log
```

### Project Structure Setup

```
create directory ~/new_project/src
create directory ~/new_project/tests
create directory ~/new_project/docs
create file ~/new_project/README.md with # New Project
create file ~/new_project/package.json with {"name": "new_project"}
```

## Permissions and Security

### User Permissions

The agent has the same file system permissions as the current logged-in user:
- ✅ Create, read, write, delete files you own
- ✅ Access files with appropriate permissions
- ❌ Access files without proper permissions
- ❌ Modify system files without proper permissions

### Best Practices

✅ **Do:**
- Backup important files before operations
- Use descriptive file names
- Organize files in logical directories
- Test operations on non-critical files first

❌ **Don't:**
- Delete system files
- Modify files without backup
- Use paths outside your home directory without need
- Perform recursive deletions without verification

## Error Handling

### Common Errors

**FILE_NOT_FOUND**
```
Path does not exist
```
**Solution**: Verify the path and try again

**FILE_EXISTS**
```
File already exists
```
**Solution**: Use a different file name or specify overwrite

**IS_DIRECTORY**
```
Path is a directory, not a file
```
**Solution**: Use directory operations instead

**DIR_NOT_EMPTY**
```
Directory is not empty
```
**Solution**: Use `recursive: true` to delete with contents

**MISSING_PARAMS**
```
Required parameters missing
```
**Solution**: Provide all required parameters (path, content, etc.)

**PERMISSION_DENIED**
```
Permission denied
```
**Solution**: Check file permissions or use appropriate paths

## Performance Considerations

### Large Files

- Reading very large files displays full content
- Consider breaking into smaller files
- Use append for log files instead of reading all

### Directory Listing

- Listing large directories may take time
- Results include all files and metadata
- Filter results mentally or in follow-up commands

### Recursive Operations

- Recursive copy/delete on large directory trees takes time
- Be patient with nested directories
- Use with caution on large directory structures

## Troubleshooting

### Command Not Recognized

If a file command isn't recognized:

```
/files
```

Check the command format in the help menu and adjust your syntax.

### Path Not Found

Verify the correct path:

```
pwd
list ~/
```

Check your current directory and navigate as needed.

### Permission Issues

```
info /path/to/file
```

Check file permissions and your user privileges.

### Syntax Help

Use natural language variations:
```
create file at /path/file.txt with content
write to /path/file.txt containing content
new file /path/file.txt: content
```

## Command Cheat Sheet

| Action | Command |
|--------|---------|
| Create file | `create file /path with content` |
| Read file | `read file /path` |
| Update file | `update file /path with content` |
| Delete file | `delete file /path` |
| Create dir | `create directory /path` |
| Delete dir | `delete directory /path recursive` |
| List dir | `list /path` |
| Copy | `copy /src to /dst` |
| Move | `move /src to /dst` |
| Rename | `rename /path as newname` |
| Info | `info /path` |
| PWD | `pwd` |
| CD | `cd /path` |

## Integration with AI Assistant

File commands are automatically detected and processed. You can:

1. **Ask questions and get file operations**:
   ```
   "Create a config file at ~/app.config with these settings: {}"
   ```

2. **Reference files in conversations**:
   ```
   "Read ~/project/README.md and summarize it"
   ```

3. **Mix file operations with chat**:
   ```
   "Create a Python script at ~/test.py with a hello world program"
   ```

The assistant understands file operations and performs them without explicit `/files` prefix.

## Coming Soon

- 🔄 Batch file operations
- 📊 File statistics and analysis
- 🔍 Search and find commands
- 📝 Syntax highlighting for code files
- 🔐 File encryption/decryption
- 📦 Archive creation (zip, tar)
- 🔗 Symbolic link support

## Support

For issues or questions:
1. Check this guide
2. Use `/files` for command reference
3. Review command examples
4. Check file system permissions
5. Review application logs

---

**Remember**: File operations are powerful. Always verify important operations and maintain backups of critical data.
