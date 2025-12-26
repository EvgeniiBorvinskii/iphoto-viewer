"""
iPhone Photo Reader using pymobiledevice3
Alternative to libimobiledevice - pure Python implementation
"""

import sys
import json

try:
    from pymobiledevice3.lockdown import LockdownClient
    from pymobiledevice3.services.afc import AfcService
    from pymobiledevice3.services.mobile_image_mounter import MobileImageMounterService
    import os
    
    def list_devices():
        """List all connected iOS devices"""
        try:
            # Get device UDIDs
            from pymobiledevice3.usbmux import list_devices as list_usb_devices
            devices = list_usb_devices()
            result = [{"udid": device.serial, "connection_type": device.connection_type} for device in devices]
            print(json.dumps(result))
            return result
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            return []
    
    def get_device_info(udid=None):
        """Get device information"""
        try:
            lockdown = LockdownClient(udid=udid)
            info = {
                "DeviceName": lockdown.get_value(key='DeviceName'),
                "ProductType": lockdown.get_value(key='ProductType'),
                "ProductVersion": lockdown.get_value(key='ProductVersion'),
                "UniqueDeviceID": lockdown.get_value(key='UniqueDeviceID'),
            }
            print(json.dumps(info))
            return info
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            return None
    
    def list_photos(udid=None):
        """List all photos from iPhone DCIM folder"""
        try:
            lockdown = LockdownClient(udid=udid)
            afc = AfcService(lockdown=lockdown)
            
            photos = []
            
            # Navigate to DCIM folder
            try:
                afc_info = afc.listdir('/DCIM')
                
                for folder in afc_info:
                    if folder.startswith('.'):
                        continue
                    
                    folder_path = f'/DCIM/{folder}'
                    try:
                        files = afc.listdir(folder_path)
                        
                        for file in files:
                            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.heic', '.mov', '.mp4')):
                                photos.append({
                                    "filename": file,
                                    "path": f'{folder_path}/{file}',
                                    "folder": folder
                                })
                    except:
                        continue
                        
            except Exception as e:
                print(json.dumps({"error": f"Cannot access DCIM: {str(e)}"}))
                return []
            
            print(json.dumps({"photos": photos, "total": len(photos)}))
            return photos
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            return []
    
    def get_photo(udid, photo_path, output_path):
        """Download a specific photo"""
        try:
            lockdown = LockdownClient(udid=udid)
            afc = AfcService(lockdown=lockdown)
            
            # Read photo data
            with afc.open(photo_path, 'r') as remote_file:
                photo_data = remote_file.read()
            
            # Save to output path
            with open(output_path, 'wb') as local_file:
                local_file.write(photo_data)
            
            print(json.dumps({"success": True, "path": output_path}))
            return True
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            return False
    
    # Main entry point
    if __name__ == "__main__":
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No command specified"}))
            sys.exit(1)
        
        command = sys.argv[1]
        
        if command == "list_devices":
            list_devices()
        elif command == "device_info":
            udid = sys.argv[2] if len(sys.argv) > 2 else None
            get_device_info(udid)
        elif command == "list_photos":
            udid = sys.argv[2] if len(sys.argv) > 2 else None
            list_photos(udid)
        elif command == "get_photo":
            if len(sys.argv) < 5:
                print(json.dumps({"error": "Usage: get_photo <udid> <photo_path> <output_path>"}))
                sys.exit(1)
            get_photo(sys.argv[2], sys.argv[3], sys.argv[4])
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)

except ImportError:
    print(json.dumps({
        "error": "pymobiledevice3 not installed",
        "install": "pip install pymobiledevice3"
    }))
    sys.exit(1)
