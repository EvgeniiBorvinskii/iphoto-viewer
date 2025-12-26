"""
Simple iPhone photo counter using Windows API
Works without iTunes using native Windows Portable Device API
"""
import sys
import win32com.client

def find_iphone_photos():
    try:
        shell = win32com.client.Dispatch("Shell.Application")
        computer = shell.Namespace(17)  # My Computer
        
        total_photos = 0
        found_iphone = False
        
        for device in computer.Items():
            device_name = str(device.Name)
            
            if "iphone" in device_name.lower() or "ipad" in device_name.lower():
                print(f"DEVICE_FOUND:{device_name}", flush=True)
                found_iphone = True
                
                try:
                    device_folder = shell.Namespace(device.Path)
                    
                    if device_folder:
                        # Look for Internal Storage
                        for storage in device_folder.Items():
                            storage_name = str(storage.Name)
                            print(f"STORAGE:{storage_name}", flush=True)
                            
                            if "internal" in storage_name.lower() or "storage" in storage_name.lower():
                                storage_folder = shell.Namespace(storage.Path)
                                
                                if storage_folder:
                                    # Look for DCIM
                                    for folder in storage_folder.Items():
                                        folder_name = str(folder.Name)
                                        
                                        if folder_name.upper() == "DCIM":
                                            print(f"DCIM_FOUND:{folder.Path}", flush=True)
                                            
                                            # Count photos recursively
                                            dcim_folder = shell.Namespace(folder.Path)
                                            if dcim_folder:
                                                total_photos = count_photos_recursive(shell, dcim_folder, 0)
                                
                except Exception as e:
                    print(f"ERROR_ACCESSING_DEVICE:{str(e)}", flush=True)
        
        if found_iphone:
            print(f"TOTAL_PHOTOS:{total_photos}", flush=True)
        else:
            print("NO_IPHONE_FOUND", flush=True)
            
    except Exception as e:
        print(f"SCRIPT_ERROR:{str(e)}", flush=True)

def count_photos_recursive(shell, folder, depth):
    """Recursively count photo files"""
    if depth > 15:  # Prevent infinite recursion
        return 0
    
    count = 0
    photo_extensions = {'.jpg', '.jpeg', '.png', '.heic', '.heif', '.mov', '.mp4'}
    
    try:
        for item in folder.Items():
            try:
                if item.IsFolder:
                    # Recurse into subfolder
                    subfolder = shell.Namespace(item.Path)
                    if subfolder:
                        count += count_photos_recursive(shell, subfolder, depth + 1)
                else:
                    # Check if it's a photo
                    item_name = str(item.Name).lower()
                    if any(item_name.endswith(ext) for ext in photo_extensions):
                        count += 1
                        # Print first 10 photos for debugging
                        if count <= 10:
                            print(f"PHOTO:{item.Name}", flush=True)
            except:
                continue  # Skip inaccessible items
                
    except Exception as e:
        print(f"ERROR_SCANNING:{str(e)}", flush=True)
    
    return count

if __name__ == "__main__":
    find_iphone_photos()
